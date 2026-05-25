# Subscriptions — MVP block design

Дата: 2026-05-21
Issue: будет создан при старте работы (см. github.com/JinKoro/sub0)
Контекст: реализация блока «Подписки» из MVP roadmap. UI на фронте уже
свёрстан на моках; бэка нет; service/category seed-ы уже накатаны
миграциями 0009/0010. Дальше — связать UI с реальным API + добавить
red-zone bulk delete и оставить корректный каскад при удалении проекта.

## 1. Скоуп

В работе:

- CRUD подписки: create / read / update (POST) / soft-delete одиночной.
- Список подписок с серверной пагинацией, сортировкой и фильтрами
  (search, category, status), URL-state.
- API словарей: `GET /services` (фильтр по category + поиск),
  `GET /categories` (системные).
- Backfill `billing_history` при create с `firstBillingDate < now()`
  (до 24 мес назад) по правилам ctx-business-logic.
- Обработчик кнопки «Удалить подписки» в red zone settings —
  **hard-delete** subscriptions + billing_history customer'а по всем
  проектам (одной транзакцией).
- Каскад удаления подписок при удалении проекта — оставляем текущий
  hard-delete через FK CASCADE (без правок project.service).

Не делаем (отложено в v1.1 / отдельные задачи):

- Cron генерация будущих списаний.
- Cron перевод CANCELLED → ARCHIVED по `next_billing_date`.
- Custom-категории CRUD и UI.
- Аналитика totals / валютная конвертация / календарь.
- AI-парсинг файлов и Inbox-импорт — соответствующие табы в форме
  остаются заглушкой как сейчас.

## 2. Обновления контекстных доков

В рамках этой задачи правим:

- `ai/ctx-business-logic.md`, § «Удаление»:
  - Для **Project** фиксируем hard-delete cascade через FK
    (текущая реализация). Текущий текст про soft-delete cascade
    проекта — убираем как ошибку.
  - Subscription — без изменений: индивидуальный delete остаётся
    soft (state=ARCHIVED, deleted_at=now).
  - Добавляем правило: «Bulk-операция red-zone "Удалить все
    подписки" — hard-delete subscriptions + billing_history по
    всем проектам customer'а».
- `ai/ctx-architecture.md`, § «Каскады и FK» — синхронизуем с
  business-logic (FK project → subscription / category_custom уже
  CASCADE, billing_history к project — NO ACTION; удаление цепляется
  через subscription.id → billing_history.subscription_id CASCADE).
- `docs/sub0-roadmap.md`, раздел v1.1 — добавляем строку «Custom-
  категории: CRUD + UI (страница в кабинете)».

## 3. Backend (`apps/api`)

### 3.1 CategoryModule (новый)

- `GET /categories` (auth) → `CategoryDto[]`:
  - `sku`, `nameRu`, `nameEn`, `color`.
  - Источник — таблица `category` (seed 0009).
- Простой list без фильтров, сортировка по `nameRu`.

### 3.2 ServiceModule (новый)

- `GET /services?categorySku?&q?&limit?` (auth) →
  `{ items: ServiceDto[], total }`.
  - `ServiceDto` = `{ sku, name, icon, categorySku, cancelUrl, pricingUrl }`.
  - Только `is_active = true`.
  - `q` — ILIKE по `name` (case-insensitive).
  - `categorySku` — фильтр через JOIN.
  - `limit` ≤ 50 (защита от перебора), дефолт 20. Сортировка по `name`.

### 3.3 SubscriptionModule (новый)

DTO в `packages/shared`:

```
SubscriptionDto {
  sku, projectSku,
  serviceSku?: string | null,
  name: string,        // resolved (см. ctx-business-logic § «имя и иконка»)
  icon?: string | null,
  categorySku?: string | null,
  categoryCustomSku?: string | null,
  amount: string,      // numeric → строка для точности
  currencyId: Currency,
  billingPeriodId: BillingPeriod,
  firstBillingDate: string,    // ISO
  nextBillingDate: string,
  isTrial: boolean,
  promoAmount?: string | null,
  promoEndsAt?: string | null,
  comment?: string | null,
  stateId: SubscriptionState,
  version: number,
  createdAt, updatedAt
}

SubscriptionCreateDto {
  projectSku,
  serviceSku?: string | null,
  nameCustom?: string | null,
  iconCustom?: string | null,
  categorySku: string,        // системная (MVP)
  amount: string,
  currencyId: Currency,
  billingPeriodId: BillingPeriod,
  firstBillingDate: string,
  isTrial: boolean,
  promoAmount?: string | null,
  promoEndsAt?: string | null,
  comment?: string | null,
}

SubscriptionUpdateDto = Partial<SubscriptionCreateDto> & {
  version: number,
  stateId?: SubscriptionState,  // ACTIVE | PAUSED | CANCELLED только
}

SubscriptionListQuery {
  projectSku?: string | 'all',
  status?: 'active' | 'paused' | 'cancelled' | 'archived' | 'all',
  categorySku?: string,
  q?: string,
  sort?: 'next' | 'name' | 'price',
  page?: number,       // 1-based
  pageSize?: number,   // дефолт 20, максимум 100
}

SubscriptionListResponse {
  items: SubscriptionDto[],
  total: number,
  page: number,
  pageSize: number,
}
```

Эндпоинты:

- `GET /subscriptions` — list. По умолчанию `projectSku` берётся из
  query; без него — все проекты. `status` дефолт — все, кроме
  `archived` (архив отдельным фильтром). 200.
- `GET /subscriptions/:sku` — 200 / 404.
- `POST /subscriptions` — 201 + body `SubscriptionDto`.
- `POST /subscriptions/:sku` — 200 + body `SubscriptionDto`
  (memory: POST для write, не PATCH/PUT).
- `DELETE /subscriptions/:sku` — 204. Уже archived → 404.

Доменные правила (см. ctx-business-logic):

- XOR `categoryId` / `categoryCustomId` — в MVP `categoryCustomId`
  всегда NULL (custom-категории отключены), но валидация в сервисе
  всё равно стоит.
- `serviceId IS NULL` → `nameCustom` обязателен.
- `serviceId IS NOT NULL` + `nameCustom IS NULL` → name берётся из
  `service.name`. То же для `icon`.
- promo / trial матрица:
  - Без промо: `isTrial=false`, `promoAmount IS NULL`, `promoEndsAt IS NULL`.
  - Триал: `isTrial=true`, `promoAmount='0'`, `promoEndsAt IS NOT NULL`.
  - Скидочное промо: `isTrial=false`, `promoAmount > 0 AND < amount`,
    `promoEndsAt IS NOT NULL`.
  - Всё остальное — 422.
- `nextBillingDate` при create вычисляется по сетке от
  `firstBillingDate` + `billingPeriod * n` так, чтобы попасть в
  первый момент `>= now()`.
- Update: optimistic locking — `WHERE version = ?`; rowCount=0 → 409.

Backfill `billing_history` при create:

- Если `firstBillingDate < now()`:
  - `cycles = floor((now() - firstBillingDate) / billingPeriod)`.
  - Ограничение: cycles ≤ 24 при MONTH, ≤ 2 при YEAR (фактически
    те же 24 мес).
  - Для каждого прошедшего цикла INSERT в billing_history:
    - `periodStart = firstBillingDate + i*billingPeriod`
    - `periodEnd = firstBillingDate + (i+1)*billingPeriod`
    - `billedAt = periodEnd`
    - `amount` / `isPromo`: если `periodEnd <= promoEndsAt` →
      `promoAmount` + `is_promo=true`, иначе `amount` + `false`.
- Всё в одной транзакции с INSERT subscription. Откат при ошибке
  любой части.
- `nextBillingDate = firstBillingDate + (cycles+1)*billingPeriod`.

### 3.4 CustomerController дополнение

- `DELETE /customers/me/subscriptions` — 204.
  - В одной транзакции:
    - `DELETE FROM billing_history WHERE customer_id = $1` (hard).
    - `DELETE FROM subscription WHERE customer_id = $1` (hard).
    - Порядок важен: history первым, чтобы не дёргать каскад
      впустую; subscription вторым — записей в history к этому
      моменту уже нет.
  - **Никакого soft** — red-zone требует физическое удаление
    без «архива».

### 3.5 Project — без правок

`ProjectService.delete` остаётся hard-delete cascade через FK
(`subscription.project_id ON DELETE CASCADE` уже стоит). Подписки
проекта уходят физически. Это то поведение, которое пользователь
ожидает («при удалении проекта удалялись его подписки»). Тест в
`project.service.spec.ts` уже покрывает каскад или добавляем
короткий e2e на subscription-каскад.

### 3.6 Миграции

Не требуются — все таблицы и индексы на месте.

### 3.7 Тесты

- `subscription.service.spec.ts` — валидации XOR / promo / trial /
  name-required, backfill (граничные случаи: ровно 24 мес,
  firstBillingDate в будущем — backfill=0, promo до/после period_end),
  optimistic locking, next_billing_date.
- `subscription.e2e-spec.ts` — полный lifecycle: create →
  list (фильтры/сортировка/пагинация) → update → delete →
  archived-фильтр.
- `customer.service.spec.ts` / e2e — `DELETE /customers/me/subscriptions`
  чистит обе таблицы транзакционно; идемпотентность (повторный вызов
  возвращает 204 без ошибок).
- `project` — короткий e2e на cascade subscription при hard-delete
  проекта.

## 4. Frontend (`apps/web`) — FSD

### 4.1 Новые / расширенные слайсы

- `entities/service` (новый):
  - `api/list.ts` — `getServices(q, categorySku, limit)`.
  - `model/types.ts` — `ServiceDto` ре-экспорт из shared.
- `entities/category` (новый):
  - `api/list.ts` — `getCategories()`.
  - `model/types.ts`.
- `entities/subscription`:
  - `api/` — `list / get / create / update / remove`.
  - `model/types.ts` — UI-типы поверх DTO (decoded date, currency
    code из enum, status-key).
  - **Удаляем** `cabinet-mock.ts` и хардкод `CAB_SUBS_RAW`.
  - В `cabinet-types.ts` оставляем структурный тип для UI или
    переезжаем на `SubscriptionDto`-производный — решение на этапе
    плана.

### 4.2 Features

- `features/subscription-form` — обновить:
  - Сервис-picker: данные из `getServices` (поиск по `q`, дебаунс).
  - Категория-селект: `getCategories`.
  - Submit вызывает `createSubscription` / `updateSubscription`.
  - Валидация на клиенте (price > 0, дата заполнена, promo/trial
    матрица) — чтобы не ловить 422 на каждом чихе.
  - Optimistic locking: при 409 показываем «обновите страницу».
- `features/delete-subscription` (новый):
  - Кнопка удаления внутри формы редактирования.
  - ConfirmDialog (паттерн из projects).
  - Вызов `DELETE /subscriptions/:sku`, redirect на list.
- `features/delete-all-subscriptions` (новый):
  - Обработчик кнопки «Удалить подписки» в red zone settings.
  - ConfirmDialog с двойным подтверждением (как в delete-account).
  - Вызов `DELETE /customers/me/subscriptions`, toast «Подписки
    удалены», обновление кеша списка.

### 4.3 `_pages/subscriptions/ui/SubsListView.tsx`

- URL-state: `?page=&status=&cat=&sort=&q=` через
  `useSearchParams` + `router.replace`. URL — источник правды;
  React-state синхронизуется из URL.
- Дебаунс поискового инпута (300мс) перед записью в URL.
- Серверная пагинация: `pageSize=20`. Total и страница приходят
  с бэка.
- Loading skeleton (3-4 строки) при первом запросе и при смене
  фильтров.
- Empty state — отдельный текст «Подписок пока нет — добавьте
  первую» с CTA-кнопкой.
- Error state — компактный баннер «Не удалось загрузить» + retry.

### 4.4 Shared

- `shared/api` — добавить endpoints subscriptions/services/categories
  по существующему паттерну.

## 5. Архитектурные ограничения

- Stateless API — все списки/фильтры идут в Postgres, никакого
  in-memory кеша. Памяти процесса не доверяем (см. AGENTS.md).
- Backfill billing_history — в той же транзакции, что и создание
  subscription. Идемпотентность гарантирована тем, что повторное
  создание подписки невозможно (новый sku → новые записи; для одной
  и той же подписки backfill вызывается ровно один раз — при create).
- `DELETE /customers/me/subscriptions` — единая транзакция, не
  идемпотентен в смысле «удалит ровно то, что есть на момент вызова».
  Повторный вызов на пустом наборе — 204.
- Optimistic locking через `version` — обязателен для
  пользовательских апдейтов (см. ctx-business-logic).

## 6. Безопасность

- Все эндпоинты, кроме `GET /categories` / `GET /services` (на
  выбор — public/auth), — за JWT-гейтом.
- `customer_id` в любом запросе берётся из JWT, не из тела.
- Любой запрос `:sku` валидируется по принадлежности customer'у —
  иначе 404 (не 403, чтобы не leakать существование).

## 7. Открытые мелочи (решаются в плане)

- Сохраняем ли `cabinet-types.ts` структурно или полностью
  заменяем на `SubscriptionDto`-производное.
- Глобальный data-fetching: SWR / TanStack Query / нативный fetch
  с локальным состоянием. Проверить, что уже используется в проекте
  (projects/customer), и идти этим путём.
- Размер pageSize (20) — допустимо подстроить, если на UI
  смотрится плохо.
