### Purpose

Доменные инварианты Sub0 — те, что не выводятся из схемы БД.
Список правил, которые обязано поддерживать приложение, чтобы
данные в БД оставались консистентны.

Структурно: схема в `ctx-architecture.md` отвечает «как лежит»,
этот файл — «при каких условиях считается валидным».

Перед изменениями доменной логики (subscription, billing,
categories, customer state) — читать обязательно.

### Enum-значения

В БД хранятся как `int` (поля `*_id`, `state_id`). Источник
истины — `packages/shared/src/enums/`. Числовые значения
стабильны, переименование без миграции запрещено.

| Enum                | Значения                                          |
|---------------------|---------------------------------------------------|
| `Currency`          | RUB=1, USD=2, EUR=3, BYN=4                        |
| `BillingPeriod`     | MONTH=1, YEAR=2                                   |
| `Locale`            | RU=1, EN=2                                        |
| `Plan`              | FREE=1, PRO=2, TEAM=3 (TEAM — v2)                 |
| `CustomerState`     | CREATED=1, ACTIVE=2, ARCHIVED=3                   |
| `ProjectState`      | ACTIVE=1, ARCHIVED=2                              |
| `SubscriptionState` | ACTIVE=1, PAUSED=2, CANCELLED=3, ARCHIVED=4       |

Семантика customer-state:
- `CREATED` — после регистрации, до email verification.
- `ACTIVE` — email подтверждён, аккаунт работает.
- `ARCHIVED` — soft-delete (см. ниже про hard-delete-30d).

Семантика subscription-state:
- `ACTIVE` — учитывается в totals и календаре.
- `PAUSED` — исключена из totals, остаётся в списке.
- `CANCELLED` — работает до `next_billing_date`, потом cron
  переводит в `ARCHIVED`. До архивации — в календаре с маркером.
- `ARCHIVED` — используется ТОЛЬКО при cascade-удалении кастомера
  (152-ФЗ grace period). В обычном UI/фильтре подписок не показывается.
  Одиночное удаление подписки = hard-delete, без перехода в ARCHIVED.

### Subscription — категория

Поля: `category_id` (системная) и `category_custom_id` (кастомная).

- **Ровно одно из двух** заполнено. Контроль на уровне сервиса
  (CHECK в БД не вешаем — слишком хрупко при импорте/seed).
- При создании из `service` — берём `service.category_id`
  (системная категория).
- Customer может переопределить категорию в любой момент:
  поменять системную на другую системную, или на кастомную, или
  обратно. Сервис гарантирует, что одно из полей зануляется.

### Subscription — имя и иконка

Поля: `service_id`, `name_custom`, `icon_custom`.

Resolved name:
- `service_id IS NOT NULL` и `name_custom IS NULL` → `service.name`.
- `name_custom IS NOT NULL` → `name_custom` (override; работает и
  поверх service'а — кастомер хочет переименовать).
- `service_id IS NULL` → `name_custom` обязателен (NOT NULL на
  уровне приложения; в БД — nullable, потому что depends on
  service_id).

Resolved icon: ровно та же логика для `service.icon` /
`icon_custom`.

При импорте из service всегда оставляем `name_custom = NULL`,
`icon_custom = NULL`, чтобы автоматически подхватывать обновления
сервиса. Override происходит только по явному действию customer'а.

### Subscription — promo / trial

**Trial** и **promo** — два независимых механизма. Любая комбинация
валидна: триал без промо, промо без триала, оба одновременно, ничего.

Поля subscription: `is_trial bool`, `trial_ends_at timestamptz`.
Промо лежит в отдельной таблице `subscription_promo` —
строк может быть много на одну подписку.

**Trial**:
- `is_trial = false` → `trial_ends_at IS NULL`.
- `is_trial = true`  → `trial_ends_at IS NOT NULL`.
- UI показывает плашку «Пробный» пока `trial_ends_at > now()`.
- На цену не влияет.

**Promo** (`subscription_promo`):
- Поля: `sku`, `subscription_id`, `amount numeric(12,2)`,
  `ends_at timestamptz`, `version`, `deleted_at`.
- Каждая строка: `amount > 0` и `amount < subscription.amount`.
- Активный промо — `ends_at > now()` и `deleted_at IS NULL`.
- Можно добавить новый промо в любой момент, можно удалить
  старый (soft-delete по `subscription_promo.sku`).

Resolved current price (для дашборда / биллинга):
- Если есть активные промо → берётся **минимальный** `amount` среди
  активных (`min(amount) WHERE ends_at > now() AND deleted_at IS NULL`).
- Иначе → `subscription.amount`.

Backfill (`computeBackfill`) при создании подписки с прошлым
`first_billing_date` использует ту же резолюцию: для каждого цикла
смотрит, какие промо были активны в момент `period_end`, берёт минимум.

### Billing history — генерация

Воркер на `@nestjs/schedule` (см. `AGENTS.md` § Архитектура)
проходит активные подписки и для каждой:

1. Если `state_id != ACTIVE` — пропуск.
2. Если `next_billing_date > now()` — пропуск.
3. Иначе — атомарно (в одной транзакции):
   - Определить current price: `promo_amount` если
     `promo_ends_at > now()`, иначе `amount`.
   - INSERT в `billing_history`:
     - `period_start = subscription.next_billing_date - billing_period`
     - `period_end = subscription.next_billing_date`
     - `billed_at = now()`
     - `amount`, `currency_id` — current price + currency подписки.
     - `is_promo = (current price пришёл из promo_amount)`.
   - UPDATE `subscription`:
     - `next_billing_date += billing_period`
     - `version += 1`.

Воркер идемпотентен: повторный запуск не создаст дубль, потому
что после UPDATE `next_billing_date` в будущем. Двойной запуск
параллельно защищён `SELECT ... FOR UPDATE SKIP LOCKED` или
advisory-lock на customer_id (см. `AGENTS.md`).

**«Сегодня» — день биллинга на весь UTC-день.** Если customer
указал `next_billing_date = today` (по UTC), запись считается
ещё не списанной до конца UTC-суток. UI показывает «Сегодня»
вместо даты. Cron на следующих сутках находит `next_billing_date
< startOfUtcDay(now)`, создаёт запись в `billing_history` и
сдвигает `next_billing_date` на следующий цикл. См.
`apps/api/src/subscription/billing-cycle.ts`
(`startOfUtcDay`, `nextBillingDateAfter`, `countElapsedCycles`).

**`first_billing_date` иммутабельно после создания.** В MVP при
создании подписки выполняется backfill в `billing_history`, и
дальше дата старта подписки не редактируется через `POST
/subscriptions/:sku` — сервис отвечает 422, если прислать
изменённый `firstBillingDate`. FE на edit-форме показывает
поле read-only с пометкой «меняется через редактор истории
(скоро)». Снимется ограничение в v1.1 вместе с редактором
`billing_history` (см. `docs/sub0-roadmap.md`).
`next_billing_date` редактируется свободно — это только сдвиг
таймера cron, без ретро-эффектов на историю.

### Billing history — backfill при создании

Customer создаёт подписку с `first_billing_date < now()` (например,
импорт уже существующей подписки). Сервис при создании:

1. Считает количество прошедших циклов:
   `cycles = (now() - first_billing_date) / billing_period`.
2. Для каждого прошедшего цикла создаёт запись в
   `billing_history`:
   - `period_start = first_billing_date + i * billing_period`
   - `period_end = first_billing_date + (i+1) * billing_period`
   - `billed_at = period_end` (или `now()` для последнего —
     решается ad-hoc; пока пишем `period_end`).
   - Учитываем промо: если `period_end <= promo_ends_at` →
     `amount = promo_amount`, `is_promo = true`. Иначе →
     `amount = subscription.amount`, `is_promo = false`.
3. `subscription.next_billing_date` устанавливается в первый
   момент после `now()` по сетке.

Limits: backfill ограничен 24 месяцами назад от `now()` — длиннее
смысла нет, customer просто введёт текущий цикл и забудет.

### Удаление

- **Subscription** (одиночное удаление через UI) — **hard-delete**:
  `DELETE FROM subscription WHERE id = ?` + каскад на
  `billing_history` и `subscription_promo` через FK. Восстановить
  нельзя — UI явно предупреждает «удалится безвозвратно».
- **Billing_history** — soft-delete (для случая удаления
  ошибочно созданной записи импорта). Customer-facing UI обычно
  не предоставляет удаление истории; это чисто backend-операция.
- **Project** — **hard-delete** каскадом через FK
  (`subscription.project_id ON DELETE CASCADE`). Подписки и
  `category_custom` проекта удаляются физически; `billing_history`
  уходит каскадно через `subscription.id`. История проекта не
  переживает удаление — это сознательный выбор: customer удаляет
  «контейнер» вместе со всей его историей. Если в будущем
  потребуется сохранять историю — заводим soft-delete отдельной
  задачей.
- **Bulk-операция «Удалить все подписки» (red zone settings)** —
  hard-delete: `DELETE FROM subscription WHERE customer_id = ?`
  (одной транзакцией с `DELETE FROM billing_history WHERE
  customer_id = ?`). По всем проектам. Аккаунт остаётся жив, но
  подписок и истории — ноль. Без soft.
- **Customer** — soft-delete: `deleted_at = now()`,
  `state_id = ARCHIVED`. Через 30 дней (152-ФЗ grace period) —
  hard-delete по cron'у: каскад удаляет всё дочернее (project,
  subscription, billing_history, refresh_token).

После hard-delete никаких остатков в логах (см.
`ctx-security.md` § 9 — PII redaction).

### SKU — генерация

Формат: `<prefix>-<8-symbol base32-crockford>`.

Префиксы:
- `cus` — customer
- `prj` — project
- `sub` — subscription
- `bil` — billing_history
- `cat` — category (системная, в seed-скрипте)
- `cct` — category_custom
- `srv` — service (в seed-скрипте)

Алгоритм:
1. Сгенерировать 5 случайных байт (`crypto.randomBytes(5)`).
2. Закодировать в base32-crockford (без I/L/O/U).
3. Взять первые 8 символов.
4. INSERT ... ON CONFLICT (sku) DO NOTHING; если 0 строк
   вставлено — повторить (вероятность коллизии при 32^8 ≈
   1 на триллион записей; ретрай — это для очистки совести).

Системные `sku` (`cat-*`, `srv-*` в seed) можно делать
читабельными — `cat-video`, `srv-netflix`. Это исключение из
«случайной генерации».

### Optimistic locking

Все доменные апдейты:

```sql
UPDATE <table> SET ..., version = version + 1
WHERE id = $1 AND deleted_at IS NULL AND version = $2;
```

Если `rowCount = 0` — либо строка не существует / удалена, либо
версия устарела. На уровне API → 409 Conflict с понятным
сообщением «обновите страницу и попробуйте ещё раз».

Не нужно везде — для аудит-логов / счётчиков (где конкуренция
ожидаема и lost update не проблема) можно без version. Но для
всего, что customer редактирует через UI, — обязательно.

### Currency — конвертация для аналитики

Подписки хранятся в собственной валюте (`currency_id` из подписки).
Customer.currency_id — валюта аналитики (totals на дашборде):

- Каждое значение в дашборде показывается в собственной валюте +
  опционально конвертируется в `customer.currency_id`.
- Источник курсов — таблица курсов ЦБ РФ (см. `AGENTS.md` и
  `ctx-security.md` §11).
- Если курс не доступен (stale_at), UI показывает значок и
  пометку «курс устарел».

### Customer.currency_id vs subscription.currency_id

- `customer.currency_id` — валюта **отображения** аналитики.
  Меняется в настройках, не влияет на хранимые суммы подписок.
- `subscription.currency_id` — валюта **списания**. Соответствует
  валюте, которую customer платит провайдеру.

Эти два поля независимы. Customer в РФ может платить за Netflix
в USD, а totals смотреть в RUB.

### Time zones

См. `ctx-frontend-fsd.md` § «Time zones». Все `*_at` поля в БД —
`timestamptz` (UTC). Бизнес-даты типа `next_billing_date` тоже
UTC; локальное время для UI / нотификаций считается из
`customer.timezone` в момент рендера.

### Free tier — лимиты

Из roadmap §«Фримиум»: Free — ограниченный набор слотов, Paid —
безлимит. Пока эквайеров нет, все юзеры на `Plan.FREE`
(`customer.plan_id = 1`). `Plan.PRO` (и выше) — без лимитов.

**Подписки — лимит 5.** В счёт идут все **не-архивные не-удалённые**
подписки:

- `ACTIVE`, `PAUSED`, `CANCELLED` — занимают слот;
- `ARCHIVED` — **не** занимает (финальное состояние);
- `deleted_at IS NOT NULL` — **не** занимает.

**Проекты — лимит 1.** Считаются активные не-soft-deleted
(`stateId = ACTIVE AND deleted_at IS NULL` — те же, что показывает
`GET /projects`). Дополнительно на Free в шапке (`ProjectSwitcher`)
скрыта CTA «Новый проект» — управление проектом и апсейл живут
на `/account/projects`.

**Где проверяется.** `SubscriptionService.create` и
`ProjectService.create` — до резолва зависимостей. Бэк — источник
истины; UI рисует баннер/disabled-CTA заранее для UX, но
рассчитывать на клиентскую проверку нельзя.

**API-контракт.** При превышении лимита соответствующий
`POST /subscriptions` или `POST /projects` отвечает
`422 Unprocessable Entity`:

```json
{ "message": "free_tier_limit_reached", "limit": 5 }
{ "message": "free_tier_project_limit_reached", "limit": 1 }
```

Константы и коды ошибок — в `packages/shared/src/plan-limits.ts`:
`FREE_TIER_SUBSCRIPTION_LIMIT` / `FREE_TIER_LIMIT_ERROR` и
`FREE_TIER_PROJECT_LIMIT` / `FREE_TIER_PROJECT_LIMIT_ERROR`.

**Что не считается лимитом.** Изменение существующих подписок
(переход `ACTIVE → PAUSED`, смена цены, добавление промо) лимит не
триггерит — он стоит только на `create`. Снятие через `ARCHIVED`
освобождает слот. Update проекта тоже свободен — лимит проверяется
только при `POST /projects`.

### Payment — история платежей за тариф

Таблица `payment` хранит факты оплат тарифа Sub0 (не подписок
юзера — у тех своя `billing_history`). Поля: `customer_id` (CASCADE),
`provider_id` (`PaymentProvider`), `provider_payment_id` (строка от
эквайера), `paid_plan_id` (`PaidPlan.PRO_MONTHLY|PRO_YEARLY`),
`amount + currency_id`, `status_id` (`PaymentStatus`), `paid_until`
(до какой даты оплачен тариф; источник для `customer.plan_expires_at`).

**Идемпотентность.** `UNIQUE (provider_id, provider_payment_id)`
гарантирует, что повторный webhook от провайдера не создаёт дубль.
Контракт вебхука: upsert по этой паре, статус двигается вперёд
(`PENDING → SUCCEEDED → REFUNDED`).

**Read-endpoint.** `GET /customers/me/payments?page&pageSize` отдаёт
`{ items: [{ sku, paidAt, paidPlanId, amount, currencyId, statusId }],
total, page, pageSize }`. Используется в Settings → Billing →
«История платежей» (`InvoiceTable`). `sku` (`pay-XXXXXXXX`) — публичный
номер счёта.

**Vs `billing_history`.** Совпадающие имена, но разные сущности:
`billing_history` — списания юзера за его подписки (Netflix, Spotify),
`payment` — оплата самого Sub0. Не путать.

**MockPaymentProvider (MVP).** До подписания договоров с эквайерами
весь upgrade-flow синхронный: `provider.charge()` сразу возвращает
`{ providerId: PaymentProvider.MOCK, providerPaymentId: uuid(),
statusId: PaymentStatus.SUCCEEDED }`. Реальные провайдеры
(СБП / T-Bank / Сбер / BePaid) появятся позже — заменят
`PAYMENT_PROVIDER` в `PaymentModule`, доменный код тот же.

**Endpoint апгрейда.** `POST /customers/me/upgrade` принимает
`{ paidPlanId: PaidPlan.PRO_MONTHLY | PRO_YEARLY }`, в одной
транзакции пишет `payment` и обновляет `customer.plan_id = Plan.PRO`,
`customer.plan_expires_at = paid_until`, `version + 1`.

**Формула `paid_until`:**

- `customer.plan_id = FREE` **или** `plan_expires_at IS NULL` **или**
  `plan_expires_at <= now()` → `paid_until = now() + period`.
- Активный PRO (`plan_id = PRO AND plan_expires_at > now()`) →
  `paid_until = plan_expires_at + period` — продлеваем от конца
  оплаченного периода, чтобы юзер, купивший второй месяц
  заранее, не терял дни.

Период — 1 месяц для `PRO_MONTHLY`, 1 год для `PRO_YEARLY`. Время
считается в UTC (`setUTCMonth` / `setUTCFullYear`).

Цены — `PRO_MONTHLY_PRICE_RUB` / `PRO_YEARLY_PRICE_RUB` в
`packages/shared/src/plan-limits.ts`; валюта RUB. Это источник
истины и для бэка (mock-апгрейд), и для фронта (UpgradePlanPage).

**Plan expiry cron.** Без реального автосписания (нужны эквайеры)
PRO «не продлевается сам». `CustomerScheduler.planExpiry()` раз в час
проходит по таблице и переводит в FREE всех с `plan_id = PRO AND
plan_expires_at <= now()`: `plan_id = FREE`, `plan_expires_at = NULL`,
`version + 1`. После UPDATE подходящих строк больше нет, повторный
запуск (вторая реплика) — no-op. Существующие подписки/проекты при
downgrade не трогаются — Free-лимит стоит только на `create`.

**Email-verified gate.** Roadmap: «Email verification обязательна до
первой оплаты». `PaymentService.upgrade` отказывает (`403 Forbidden`)
если `customer.state_id != CustomerState.ACTIVE`. Это покрывает
`CREATED` (email не подтверждён) и `ARCHIVED` (soft-deleted). Тело
ответа — `{ message: 'email_not_verified' }`, константа в
`packages/shared/src/plan-limits.ts → EMAIL_NOT_VERIFIED_ERROR`.

### Notifications — матрица событий и каналов

Per-customer строки в `notification_event_preference`
(`(customer_id, event_id)` уникален). Событий — 5
(`NotificationEvent`): UPCOMING_CHARGE, TRIAL_END, PLAN_RENEWAL,
MONTHLY_REPORT, RELEASES. Каналов — 3 (`NotificationChannelType`):
EMAIL (рабочий), TELEGRAM и MAX (хранятся, не доставляются — link-flow
и доставка через `notification_channel` — отдельная задача).

**Дефолты.** Если строки в `notification_event_preference` нет, сервис
синтезирует дефолт прямо в GET — БД не трогаем без явного PATCH'а.
Дефолты:

- UPCOMING_CHARGE → `enabled=true, channels=[EMAIL], daysBefore=[3]`.
- TRIAL_END / PLAN_RENEWAL / MONTHLY_REPORT / RELEASES → `enabled=false,
  channels=[], daysBefore=[]`.

Воркер `BillingNotificationScheduler` использует тот же контракт: LEFT
JOIN на preference + `COALESCE` с дефолтами. Customer без строки
получает email за 3 дня до списания «из коробки».

**Endpoints.**

- `GET /customers/me/notifications` — агрегированный read.
  Возвращает все 5 событий (реальные + дефолтные) плюс quiet hours.
- `POST /customers/me/notifications/preferences` — body
  `{ items: [{ eventId, enabled?, channelTypeIds?, daysBefore? }] }`.
  Сервис мержит partial-апдейт с предыдущей строкой (или дефолтом) и
  делает upsert по `(customer_id, event_id)`.
- `POST /customers/me/quiet-hours` — body `{ enabled, from?, to?,
  version }`. Колонки `customer.quiet_hours_*`; under optimistic-lock
  по `customer.version`.

**Quiet hours.** `quiet_hours_from`/`quiet_hours_to` интерпретируются в
`customer.timezone`. Воркер при cron-тике конвертирует `now() AT TIME
ZONE customer.timezone` в время и пропускает строку, если попадает в
окно. Окно может пересекать полночь (`from > to`).

**Контракт по старым полям.** `customer.notifications_enabled` и
`customer.notification_lead_days` остаются в схеме до отдельной
contract-миграции (expand → migrate code → contract). Новый воркер их
не читает, легаси-endpoint `POST /customers/me/notifications` удалён.
