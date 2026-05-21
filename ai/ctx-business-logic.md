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
- `ARCHIVED` — не учитывается, видна только в фильтре «архив».

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

Поля: `is_trial bool`, `promo_amount numeric(12,2)`,
`promo_ends_at timestamptz`.

Валидные состояния:
- Без промо: `is_trial = false`, `promo_amount IS NULL`,
  `promo_ends_at IS NULL`.
- Триал: `is_trial = true`, `promo_amount = 0`,
  `promo_ends_at IS NOT NULL`. UI показывает плашку «Триал».
- Скидочное промо: `is_trial = false`, `promo_amount > 0` и
  `< amount`, `promo_ends_at IS NOT NULL`. UI показывает плашку
  «Промо до DD.MM.YYYY».

Невалидные состояния (сервис обязан отклонять):
- `promo_amount IS NOT NULL` и `promo_ends_at IS NULL`.
- `promo_ends_at IS NOT NULL` и `promo_amount IS NULL`.
- `is_trial = true` и `promo_amount != 0`.
- `is_trial = true` и `promo_ends_at IS NULL`.

Resolved current price (для дашборда / списания):
- `promo_ends_at IS NULL` или `promo_ends_at <= now()` → `amount`.
- Иначе → `promo_amount`.

`is_trial` сохраняется как UX-семантика (UI показывает разные
плашки и считает «триалы на отмену» отдельным виджетом). На
расчёт суммы он не влияет — влияет только `promo_amount`.

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

- **Subscription** (одиночное удаление через UI) — soft-delete:
  `deleted_at = now()`, `state_id = ARCHIVED`. Остаётся в фильтре
  «архив».
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
