# Sub0

Веб-сервис учёта подписок. Полный план — `docs/sub0-roadmap.md`,
правила работы и стэк — `AGENTS.md`.

## Локальный запуск

### Требования
- Docker + Docker Compose
- Node.js 20+
- Yarn Berry (`corepack enable && corepack prepare yarn@stable --activate`)

### Шаги

```bash
# 1. Поднять Postgres + MailHog
docker compose up -d

# 2. Установить зависимости
yarn install

# 3. Скопировать env-файл API
cp apps/api/.env.example apps/api/.env

# 4. Запустить web и api в watch-режиме
yarn dev
```

### Сервисы

| Сервис        | URL                                              |
| ------------- | ------------------------------------------------ |
| Next.js (web) | http://localhost:3000                            |
| NestJS (api)  | http://localhost:3001                            |
| Postgres      | postgresql://sub0:sub0@localhost:5432/sub0       |
| MailHog SMTP  | localhost:1025                                   |
| MailHog UI    | http://localhost:8025                            |

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
- `apps/api` — NestJS 10 + Prisma (Prisma подключается отдельной
  таской; путь — `apps/api/prisma/`).
- `packages/shared` — DTO, типы, общие i18n-ключи.

## Архитектурные принципы и правила работы

См. `AGENTS.md` (раздел `### Архитектура`) — ключевое: код
**scale-ready, не scaled**. Stateless API, идемпотентные cron'ы,
side-effects через outbox/таблицу задач. Redis / отдельный воркер /
read-replica поднимаются под конкретную задачу из roadmap, а не
про запас.
