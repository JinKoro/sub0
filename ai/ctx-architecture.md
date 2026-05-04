### Purpose

Архитектурные правила и доменные конвенции БД для Sub0. Дополняет
короткий раздел `### Архитектура` в `AGENTS.md` (там — общие принципы
scale-ready / cron / outbox / expand-migrate-contract). Этот файл —
про конкретные конвенции, которые касаются каждого PR со схемой и
бизнес-кодом.

Перед изменениями БД-схемы или миграций — читать обязательно.

### Доменные сущности (терминология)

- **customer** — основной актор системы. В коде, БД, доменных
  сервисах, FSD-слое и API DTO используем `customer` (не `user`).
  «User» допустим только в нейтральных абстракциях вроде
  `userAgent` (HTTP), `useSession` (React-хук про сессию, не про
  сущность), и в auth-контексте JWT (`req.user` — часть
  стандарта passport, не наш домен).
- **project** — пространство, в котором живут подписки одного
  customer'а. На регистрации создаётся дефолтный «Personal»;
  customer может создать ещё. Все подписки / категории /
  billing_history scoped по `project_id`.
- **subscription**, **service**, **category** / **category_custom**,
  **billing_history** — см. `ctx-business-logic.md`.

### Конвенции таблиц

#### 1. Имена в единственном числе

`customer`, `project`, `subscription`, `service`, `category`,
`category_custom`, `billing_history`, `oauth_account`,
`refresh_token`. Не `customers`, не `subscriptions`. Drizzle-файлы
схемы — соответственно `customer.ts`, `project.ts` и т.д.

Исключение — табличные переменные в TS могут быть во множественном
для читаемости (`db.select().from(customers)`), но имя таблицы в
Postgres — единственное число.

#### 2. Каждая бизнес-сущность имеет `sku`

`sku varchar(12) NOT NULL UNIQUE` — публичный человеко-читаемый
идентификатор, который попадает в URL, экспорт, Telegram-команды.
Внутренний `id uuid` — для FK, JOIN'ов, индексов; наружу не уходит.

- Формат: `<prefix>-<8 символов base32-crockford>`. Префикс из 3
  символов: `cus`, `prj`, `sub`, `bil`, `cat`, `cct`, `srv`.
- Генерация — в коде при INSERT'е, не в БД (`gen_random_uuid()`
  только для `id`).
- На UNIQUE-конфликт делаем повтор; вероятность коллизии при 8
  символах base32 ничтожна, но обработка нужна.

`oauth_account`, `refresh_token` — без `sku` (внутренние таблицы,
наружу не уходят).

#### 3. Soft-delete через `deleted_at timestamptz`

Все доменные сущности (`customer`, `project`, `subscription`,
`category_custom`, `billing_history`) имеют `deleted_at`.
Hard-delete — только спецзадачей (например, hard-delete customer'а
через 30 дней по требованию 152-ФЗ).

- Все индексы строим как partial с `WHERE deleted_at IS NULL` для
  тех запросов, где soft-deleted записи не нужны.
- Все WHERE в hot-path обязаны содержать `deleted_at IS NULL`,
  иначе они смотрят и в архив. Это проверяется в PR-review.
- `service`, `category` (системные), `oauth_account`,
  `refresh_token` — soft-delete не нужен, удаляются физически
  (либо через каскад, либо через специальный flow).

#### 4. Optimistic locking через `version int`

Доменные сущности с `version int NOT NULL DEFAULT 1`:

- `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`
- Если `rowCount = 0` — кто-то обновил параллельно → 409.
- Это защищает от lost update в API: фронт прислал старый объект,
  сохранил, перезаписал чужие изменения.

`oauth_account`, `refresh_token`, `service`, `category` (системные)
— без `version`.

#### 5. `state_id int NOT NULL` вместо `is_active boolean`

Все enum-состояния (state) лежат **в коде**, не в БД. Числовые id
стабильны и переиспользуются между API и Web через
`packages/shared/src/enums/`. См. `ctx-business-logic.md` для
конкретных значений.

#### 6. Каскады и FK

- `customer.id` каскадится на всё дочернее (project, subscription,
  category_custom, billing_history, oauth_account, refresh_token).
- `project.id` каскадится на subscription и category_custom.
  Для `billing_history.project_id` — без каскада (история
  переживает удаление проекта; project_id остаётся как
  историческая денормализация).
- `service.id` — без каскада на subscription. Удаление service'а
  → `service_id = NULL`, имя берётся из `name_custom` (см.
  `ctx-business-logic.md`).
- `category.id` (системные) — `RESTRICT`. Удаление системной
  категории должно быть отдельной задачей с миграцией данных.

### Миграции

#### 1 таблица — 1 миграция

Каждая миграция создаёт **одну** таблицу со всеми её индексами,
constraints и FK на уже существующие таблицы. Это правило
нерушимое:

- Проще ревьюить — diff фокусированный.
- Проще откатывать — каждая миграция reversible изолированно.
- Проще понимать историю — `0007_create_subscription.sql` сразу
  читается как «момент появления subscription».

Если бизнес-логика требует одновременного появления двух таблиц
(например, FK в обе стороны) — пересмотри схему: скорее всего,
обратный FK можно отложить или это признак неправильного
моделирования.

ALTER TABLE / ADD COLUMN / DROP COLUMN — отдельные миграции,
по одной правке на миграцию. Имя — `<NNNN>_<verb>_<table>_<what>.sql`,
например `0010_add_customer_telegram_chat_id.sql`.

#### Backward-compatible (expand → migrate code → contract)

Дублирует правило из `AGENTS.md`, повторяю с нюансами для
конкретных типов изменений:

- **Переименование колонки** — две миграции: добавить новую,
  скопировать данные, в коде переключиться, потом отдельной
  миграцией удалить старую.
- **NOT NULL на существующую nullable-колонку** — две миграции:
  backfill + DEFAULT, потом ALTER ... SET NOT NULL.
- **Drop column** — сначала перестать читать в коде, в следующем
  релизе — миграция drop.

#### Идемпотентность сидов

Все seed-скрипты (системные категории, services_catalog) —
upsert по `sku`. Запуск дважды не должен дублировать или ломать
данные. См. issue #10.

### Доменная схема (high-level карта)

```
customer ─┬─ oauth_account
          ├─ refresh_token
          ├─ project ─┬─ subscription ─┬─ billing_history
          │           │                 └─ (FK на category или category_custom)
          │           └─ category_custom
          └─ (косвенно через project) ─ category_custom

category (системная) ── service
                        └─ subscription (опционально)
```

Подписка обязательно scoped по customer + project. Категория —
ровно одна из двух (системная или кастомная), контроль на уровне
сервиса. Деталь — в `ctx-business-logic.md`.

### Review checklist (для PR с миграциями)

1. Одна миграция = одна таблица / одна правка?
2. Тег миграции читается без открытия SQL (`0007_create_subscription`,
   а не `0007_aberrant_weapon_omega`)?
3. Все доменные таблицы имеют `sku`, `version`, `deleted_at`,
   `created_at`, `updated_at`?
4. Все индексы для hot-path запросов — partial с
   `WHERE deleted_at IS NULL`?
5. Каскады соответствуют разделу «Каскады и FK» выше?
6. Если ALTER NOT NULL / DROP COLUMN — backfill / стадии
   соблюдены?
7. Snapshot drizzle-kit обновлён, journal содержит читаемый tag?
