### Project

Sub0 — веб-сервис учёта подписок: пользователь добавляет свои подписки
(вручную в MVP, AI-парсинг банковской выписки в v1.1), видит дашборд
с totals/календарём/ближайшими списаниями и получает напоминания
(email в MVP; Telegram + Web Push в v1.1).

Web-first: Next.js + PWA-манифест для add-to-home на iOS. Нативное
мобильное приложение — v2.

### Stack

- `apps/web` — Next.js 15 (App Router), Tailwind, `next-intl` (ru/en),
  `next-themes`, PWA manifest.
- `apps/api` — NestJS 10, Postgres + Drizzle ORM. JWT: access 15m +
  refresh 90d с ротацией (httpOnly + Secure + SameSite=Lax cookie).
- `packages/shared` — DTO, типы, общие i18n-ключи (одни и те же
  строки используются и в вебе, и в email/Telegram-нотификациях).
- Платежи (автосписание): СБП / T-Bank / Сбер для РФ, BePaid для РБ.
  Храним только токены провайдеров — карт у нас нет.
- Нотификации: email (MVP), Telegram-бот + Web Push VAPID (v1.1).
- Курсы валют: суточный pull с ЦБ РФ для конвертации USD/BYN в ₽.

### Role

Senior staff engineer на стэке Next.js + Tailwind + NestJS + Drizzle.
Проект пишется через Claude — без ручного кода. Это означает: явные
команды, минимум магии, всё проверяемо и воспроизводимо.

### Rules

- Прямые ответы и код. Без вступлений и хвостовых summary.
- Думать можно по-английски, отвечать — по-русски.
- Перед изменениями читать релевантные `ai/ctx-*.md`.
- `yarn` (1.x classic, workspaces). Не `npm`, не `pnpm`.
- **Не выдумывать имена эндпоинтов, фич, маршрутов или сервисов**,
  которых нет в `docs/sub0-roadmap.md` или в `ai/ctx-*.md`. Не уверен —
  спросить, не доимысливать.
- Перед расширением scope (новый OAuth-провайдер, новая платёжная
  интеграция, новый тип файлового аплоада, 2FA, team-аккаунты) —
  сначала обновить релевантный `ctx-*.md`, потом писать код.

### Архитектура

MVP-нагрузка скромная, но строим **scale-ready, не scaled**: код
должен позволять поднять второй инстанс API, read-replica Postgres
или выделенный воркер за день — без рефакторинга доменной логики.
Сервис не сложный и сейчас не нагружен, но архитектурные решения
с первого дня принимаются так, чтобы не загнать себя в угол.

Что это значит на практике:

- **API stateless.** Никаких in-memory счётчиков, lockout-state,
  rate-limit, кешей в процессе. Любое разделяемое состояние — через
  Postgres сейчас, через Redis когда придёт под конкретную задачу.
- **Cron / jobs идемпотентны** и защищены от двойного выполнения
  (advisory lock в Postgres или unique-constraint), чтобы при
  второй реплике API не было double-run.
- **Долгие side-effects** (email в MVP; Telegram / Web Push /
  парсинг выписки в v1.1) — не синхронно в request-handler,
  а через outbox / таблицу задач. Когда придёт BullMQ — меняется
  адаптер, не доменный код.
- **Миграции backward-compatible**: expand → migrate code →
  contract. Без даунтайма, без блокировки релизов.
- **БД-доступ под индексом**, никаких `SELECT *` в hot-path,
  N+1 ловится в PR.
- **Сквозной `x-request-id`** в логах (см. `ctx-security.md` §9) —
  чтобы трассировка работала в multi-instance.

При этом **не поднимаем инфраструктуру и не вводим абстракции про
запас**. Redis, отдельный worker-процесс, read-replica, generic
`Queue<T>` / `CacheService` — заводим под конкретную задачу из
roadmap, а не «на будущее». Готовность ≠ преждевременная сложность.
«Может пригодиться» — не аргумент; «вот таск из roadmap, который
без этого не закроем» — аргумент.

### Context Library

- `ai/ctx-architecture.md` — доменная терминология (`customer`,
  `project`, …), конвенции таблиц (`sku`, `version`, soft-delete),
  правила миграций (1 таблица — 1 миграция), каскады. Перед
  изменениями БД-схемы или миграций — читать обязательно.
- `ai/ctx-business-logic.md` — инварианты домена: enum-значения,
  правила subscription (категория XOR, name/icon override, promo /
  trial), генерация и backfill `billing_history`, soft-delete,
  optimistic locking, sku.
- `ai/ctx-frontend-fsd.md` — FSD-архитектура веба: слайсы, маршруты,
  i18n, time-zones, валюты, PWA, темы.
- `ai/ctx-design-system.md` — дизайн-система: токены, шрифты,
  типографическая шкала, сетка, отступы, shared-компоненты,
  правила переиспользования. Перед UI-изменениями читать обязательно.
- `ai/ctx-security.md` — auth, платежи, PII, headers, env, логи,
  валидация, файлы. Threat-model и review-checklist.
- `docs/sub0-roadmap.md` — план MVP / v1.1 / v2. Живой документ.
