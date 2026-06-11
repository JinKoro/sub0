### Purpose

Security-правила для Sub0 — SaaS учёта подписок. Стэк: Next.js
(`apps/web`), NestJS (`apps/api`), Postgres + Drizzle ORM. Веб-приложение
с аккаунтами, JWT-сессиями, автосписаниями (только токены провайдеров),
email/Telegram/Web-Push нотификациями. OAuth-провайдеры — v2.

Этот файл — нормативный. Если PR расширяет scope (OAuth-провайдеры,
новая платёжная интеграция, новый тип файлового аплоада, 2FA, team-
аккаунты, idea portal) — **сначала** обновляем этот файл, потом пишем
код.

### Threat Model

**Главные противники:**

- ATO (account takeover) — credential stuffing, утечка refresh-token.
- Подделка webhook’ов платёжных провайдеров.
- Утечка финансовой истории — список подписок и списаний это PII по
  факту: профилирование расходов.
- Боты на формах регистрации/reset (масс-создание учёток).

**Чувствительные данные:**

- Пароли — `argon2id`, никогда в plaintext, никогда в логах.
- Refresh tokens — `httpOnly + Secure + SameSite=Lax` cookie, ротация
  на каждый refresh.
- PII профиля: email, имя, аватар, timezone, telegram_user_id (v1.1).
- Финансовая PII: подписки (название, сумма, валюта, периодичность),
  история списаний — особо чувствительно. В MVP: TLS + access-control
  достаточно. Шифрование сумм на уровне поля БД — v2.
- Payment-токены провайдеров (СБП / T-Bank / Сбер / BePaid) — никогда
  в логах; в БД с минимальными правами доступа.
- v1.1: банковская выписка — **транзитом в памяти**. Никогда на диск,
  никогда в БД, никогда в логи.

**Out of scope в MVP** (расширяй файл при включении):

- OAuth-провайдеры (Google, Yandex), 2FA, session management UI,
  holiday mode, idea portal, team-аккаунты / projects, инструменты
  без регистрации.

### Core Rules

#### 1. Validation & encoding

- Nest: глобальный `ValidationPipe({ whitelist, forbidNonWhitelisted,
forbidUnknownValues, transform })` + DTO с `class-validator`.
- Web (server actions / route handlers): `zod` на каждом входе. Никогда
  не доверяем shape `FormData` или JSON.
- Лимиты в схемах: email ≤ 254, password 8–128 (≥1 цифра, ≥1 буква
  — решение владельца, #54; единый источник `@subzero/shared`
  `isValidPassword` / `PASSWORD_MIN` / `PASSWORD_MAX`, переиспользуется
  фронтом #50), имя ≤ 100, название подписки ≤ 200, currency — enum
  `["RUB", "USD", "EUR", "BYN"]`, периодичность — enum.
- Никаких `dangerouslySetInnerHTML` без `isomorphic-dompurify` и
  одной строки комментария-обоснования.

#### 2. Auth & sessions

- Хеширование паролей: `argon2id` (`@node-rs/argon2`), параметры по
  OWASP cheat sheet (`m=64MB, t=3, p=1`).
- Email verification обязательна **до первой оплаты** (не до
  регистрации, чтобы не ломать onboarding).
- Access JWT — 15 минут, RS256, ключ-pair в env, ротация раз в квартал.
- Refresh JWT — 90 дней, ротация на каждый refresh (старый
  невалиден, jti чёрно-списком в БД с TTL до expiry). Logout / смена
  пароля / soft-delete → удаление **всех** refresh’ей юзера.
- **Side effect ротации:** access stateless, не проверяется в БД, не
  имеет ревокации. После «удаления refresh’ей со всех устройств»
  параллельная сессия остаётся валидной до истечения её текущего
  access (≤15 мин) — следующий refresh-cycle на ней даст 401. Это
  by design для API-stateless: компромисс — ≤15 мин «хвост» против
  сложности per-request blacklist в БД. Если для конкретного потока
  нужен мгновенный разлогин (например, после смены email-логина или
  компрометации), фронт делает явный `POST /auth/logout` или сужает
  access TTL под фичу.
- Cookie refresh-токена: `httpOnly`, `Secure`, `SameSite=Lax`,
  `Path=/api/v1/auth` (scoped только на auth-роуты).
- Session-cookie `sub0_session` = access-JWT: `httpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`, TTL = access TTL (15м). Нужна для
  серверного гейта роутов кабинета во фронте (Next `middleware.ts`):
  проверяется **stateless** по RS256-public key, без БД и без
  обращения к API. Не содержит ничего сверх стандартных access-
  claims (`sub`, `plan`, `typ=access`). На `logout` / смене пароля
  чистится вместе со всеми refresh. `Secure` управляется
  `COOKIE_SECURE` (false только для локального HTTP-dev).
- Lockout: 10 неудачных login за 15 минут (ключ — `email + IP`) → блок
  на 15 минут.
- Удаление аккаунта (MVP): soft-delete сразу, hard-delete через
  30 дней. После hard-delete — никаких остатков в логах. 152-ФЗ:
  30-дневный grace period покрывает требование. `DELETE /customers/me`
  на бэке снимает обе cookie (`sub0_session`, `refresh_token`) —
  иначе текущая вкладка по живому access ещё открывала бы `/dashboard`
  до 15 минут. Регистрация на soft-deleted email отбивается 409 —
  реактивация архивного аккаунта — отдельный (отложенный) flow.
- **Project scoping (MVP):** все ресурсы (`subscription`,
  `category_custom`, `billing_history`, `notification_settings` если
  per-project) scoped по `project_id`. На любом запросе с
  `project_id` в path/query — guard проверяет, что
  `project.customer_id = req.user.id` (`req.user.id` — это claim из
  JWT и значение `customer.id`, а не отдельная сущность). На
  каждом WHERE по дочерним таблицам — обязательный
  `project_id = ?` (а не «верим, что фронт прислал свой»).
  IDOR-проверка покрыта unit-тестом для каждого CRUD. «Все
  проекты» — отдельная опция в API (`?allProjects=true`), которая
  фильтрует только по `customer_id`.

#### 3. Anti-spam (формы)

- Rate-limit на auth-эндпоинтах — на **edge (Traefik)**, не в
  приложении (AGENTS.md: API stateless; rate-limit — инфра-концерн,
  не доменный код). В коде `@nestjs/throttler` НЕ заводим. Политика
  (настраивается в Traefik):
  - `POST /auth/register` — 5 / IP / час.
  - `POST /auth/login` — 10 / `email+IP` / 15 мин (комбинируется
    с lockout — lockout остаётся в приложении, см. §2).
  - `POST /auth/forgot-password` — 3 / email / час.
- CAPTCHA **не используется** (решение владельца): ни Cloudflare
  Turnstile, ни иная — нигде, включая `/auth/register` и
  password-reset. Не предлагать и не флагать как пробел в review.
  Анти-абуз не-account-state — на edge (Traefik), см. выше.
- Honeypot — на любую публичную форму контакта/фидбэка, если
  появится: non-empty value → silent 200.

#### 4. HTTP & headers

- Nest: `helmet` + `compression`, CORS — explicit allowlist из env
  (`CORS_ORIGINS`), без `*` в prod.
- Web (`next.config.ts`): HSTS preload (≥ 6мес),
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (deny camera/microphone/geolocation),
  CSP с **nonces** через `next/script` (без `unsafe-inline` для
  `script-src`). Allowlist: own + iframe платёжных провайдеров +
  Telegram + analytics.
- HTTPS only. Все image origins (CDN сервисов из service-catalog) —
  через HTTPS.

#### 5. Payments (автосписание)

- **PCI minimization:** card number / CVV никогда не проходят
  через наш код. Юзер вводит карту в iframe / SDK провайдера
  (СБП-токенизация / BePaid widget), мы получаем только токен.
- В БД храним: `provider`, `token`, `last4`, `brand`, `expires_at` —
  больше ничего о карте.
- Webhook-эндпоинты провайдеров:
  - Signature verification **до** любого парсинга payload.
  - Idempotency по `provider_event_id`, in-memory LRU + БД-флаг
    с TTL ≥ 24ч.
  - На дубликат — 200 без побочного эффекта.
- Outbound к провайдеру: timeout 5–10s, retry с jitter, max 3 попытки;
  после — DLQ для ручного разбора.

#### 6. Files

- **Аватары (MVP):** ≤ 2MB, MIME whitelist `image/jpeg|png|webp`.
  Magic-byte check (не доверять `Content-Type` от клиента). Re-encode
  через `sharp` (защита от SVG-XSS, polyglot, embedded EXIF).
  Хранение — S3-совместимое. Public URL только через signed URL с TTL.
- **Банковские выписки (v1.1):** только в памяти (`Buffer` в Nest),
  стримом в LLM-провайдер. После ответа — `Buffer.fill(0)` + drop
  reference. Никогда на диск, никогда в БД, никогда в логи. Логируем
  только метаданные: `bank?`, `lines_count`, `duration_ms`,
  `subscriptions_found`.

#### 7. Notifications

- **Email (MVP):** провайдер с DKIM + SPF + DMARC. Reset-ссылки
  с TTL ≤ 1 час.
- **Telegram (v1.1):** bot-токен в env, никогда в клиент. Link-flow
  через deep-link с одноразовым `nonce`. В тексте сообщений — название
  подписки + сумма; **не** включать `last4` карты, payment-метаданные,
  email юзера.
  - Webhook бота: `POST /api/v1/integrations/telegram/webhook` —
    публичный (без JwtAuthGuard), гейтится заголовком
    `X-Telegram-Bot-Api-Secret-Token` (timing-safe сверка с
    `TELEGRAM_WEBHOOK_SECRET`, fail-closed: без секрета отвергаем всё).
    Verify `/start <nonce>` идемпотентен; истёкший/неизвестный nonce —
    нейтральный ответ, 200 (чтобы Telegram не ретраил бизнес-ветки).
- **Web Push (v1.1):** VAPID-ключи в env. Subscriptions хранятся
  per-device, при logout удаляются.

#### 8. Secrets & env

- `.env`, `.env.local` в `.gitignore`. `.env.example` — пустые
  плейсхолдеры.
- Boot-time валидация: `@nestjs/config` + `zod`-схема в
  `apps/api/src/config/env.schema.ts`. Web — `zod` в
  `apps/web/src/shared/lib/env.ts`. Fail fast при отсутствии или
  невалидном значении.
- `NEXT_PUBLIC_*` — только non-secret (например, `NEXT_PUBLIC_API_URL`).
  Никогда — provider keys, Telegram bot token, JWT-ключи.

#### 9. Logging & errors

- Nest: централизованный exception filter, `x-request-id` сквозной.
- Generic ошибки клиенту (без stack trace, без internal-message).
  Детали — server-side с request-id.
- PII redaction: **allow-list** полей (а не deny-list). По умолчанию
  никакие customer-данные не логируем; явно перечисляем что можно
  (например, `customer_id`, `email_hash`).
- Никогда не логируем: пароли, любые JWT, refresh-cookie,
  payment-токены, тело банковской выписки, OAuth-токены.
- Логи имеют TTL (90 дней по умолчанию).

#### 10. i18n

- Пользовательский input не интерполируется в перевод как HTML —
  только как строка.
- Имена подписок (user-controlled) при отображении в email — escape
  как HTML, в Telegram — escape как MarkdownV2.

#### 11. Currencies / exchange rates

- Внешний источник — ЦБ РФ (открытый XML). Pull раз в сутки.
- При недоступности ЦБ — отдавать последний валидный курс с пометкой
  `stale_at`. Не падать, не блокировать UI.

#### 12. Dependencies

- `yarn` (1.x classic). Commit `yarn.lock`.
- Перед merge’ем PR’а с auth / payments / files — `yarn npm audit`.
- Не тянем пакеты с downloads < 10k/нед или unmaintained > 2 лет
  на критическом пути (auth, payments, file processing, crypto).

### Review Checklist (для PR’ов в эти зоны)

1. Все входы валидированы (`zod` / `class-validator`) с лимитами
   размеров?
2. Auth: `argon2id`, JWT TTL, ротация refresh, lockout?
3. Cookie refresh — `httpOnly + Secure + SameSite=Lax`?
4. Платежи: только токены провайдера, webhook signature-verified,
   idempotency по `provider_event_id`?
5. Файлы: MIME whitelist + magic byte + re-encode? Bank statements
   не пишутся на диск?
6. Rate-limit на auth-эндпоинтах — на Traefik (не `@nestjs/throttler`);
   lockout (§2) — в приложении; CAPTCHA не используется (решение
   владельца) — её отсутствие не findings.
7. CSP + helmet + CORS allowlist?
8. Logging: PII в allow-list; никаких токенов / паролей / тел выписок
   в логах?
9. Env-переменные валидируются при старте? Секреты только server-side?
10. PR расширяет scope (2FA, team, OAuth, новый файловый flow) —
    этот файл обновлён первым?

### When in doubt

- Группировать findings по severity: **Critical** (блок merge) /
  **High** / **Medium** / **Low**. Каждое — file+line, что не так,
  риск, фикс с кодом.
- Безопаснее > удобнее. Push back на ослабления с конкретным риском
  и safer alternative. Unclear-sensitivity data → treat as sensitive.
