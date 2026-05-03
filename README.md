# Sub0

Веб-сервис учёта подписок. Полный план — `docs/sub0-roadmap.md`,
правила работы и стэк — `AGENTS.md`.

## Локальный запуск

### Требования

- Docker + Docker Compose
- Node.js 20+
- Yarn 1.x classic (`npm i -g yarn` если ещё не установлен)

### Шаги

```bash
# 1. Поднять Postgres + MailHog
docker compose up -d

# 2. Установить зависимости
yarn install

# 3. Скопировать env-файл API
cp apps/api/.env.example apps/api/.env

# 4. Применить миграции БД
yarn workspace @subzero/api drizzle:migrate

# 5. Запустить web и api в watch-режиме
yarn dev
```

### Сервисы

| Сервис        | URL                                        |
| ------------- | ------------------------------------------ |
| Next.js (web) | http://localhost:3000                      |
| NestJS (api)  | http://localhost:3001                      |
| Postgres      | postgresql://sub0:sub0@localhost:5432/sub0 |
| MailHog SMTP  | localhost:1025                             |
| MailHog UI    | http://localhost:8025                      |

Все исходящие письма из dev-окружения отправляются в MailHog —
смотреть в UI на 8025.

### Управление инфрой

```bash
docker compose up -d       # поднять
docker compose ps          # статус
docker compose logs -f     # логи
docker compose down        # остановить, том сохранить
docker compose down -v     # остановить и удалить том Postgres
```

## Структура

- `apps/web` — Next.js 15 (App Router), Tailwind, `next-intl`.
- `apps/api` — NestJS 10 + Drizzle ORM (схема в
  `apps/api/src/db/schema/`, миграции в `apps/api/drizzle/`).
- `packages/shared` — DTO, типы, общие i18n-ключи.

## Архитектурные принципы и правила работы

См. `AGENTS.md` (раздел `### Архитектура`) — ключевое: код
**scale-ready, не scaled**. Stateless API, идемпотентные cron'ы,
side-effects через outbox/таблицу задач. Redis / отдельный воркер /
read-replica поднимаются под конкретную задачу из roadmap, а не
про запас.
