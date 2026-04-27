### Frontend — Feature-Sliced Design

`apps/web/src` использует FSD-слои:

- `app/` — Next.js App Router. Route groups: `(marketing)` для
  лендинга / блога / FAQ, `(app)` для дашборда (защищён middleware
  по refresh-cookie).
- `_pages/` — page-level компоновки. Подчёркивание потому что
  имя `pages` зарезервировано Next’ом.
  - MVP: `main`, `pricing`, `login`, `register`, `dashboard`, `settings`.
  - v1.1: `blog`, `faq`.
  - v2: `project` (multi-dashboard), `tools` (без регистрации).
- `widgets/` — крупные UI-блоки.
  - `header` (логотип, навигация, language-switcher, theme-switcher,
    user-menu), `footer`.
  - `dashboard-shell`, `subscriptions-list`, `subscriptions-calendar`,
    `analytics-cards` (totals по валютам), `upcoming-charges`
    (ближайшие 30 дней), `add-subscription-modal`.
  - v1.1: `notification-rules-form`, `telegram-link-block`.
- `features/` — пользовательские интеракции.
  - Auth: `login-form`, `register-form`, `oauth-google`,
    `password-reset`, `change-password`, `delete-account`.
  - Subscriptions: `add-subscription`, `edit-subscription`,
    `delete-subscription`.
  - Settings: `switch-locale`, `switch-theme`, `upload-avatar`.
  - v1.1: `link-telegram`, `upload-bank-statement` (файл уходит
    транзитом в LLM, у нас не хранится).
- `entities/` — доменные модели и их UI.
  - `subscription`, `service-catalog` (топ-50 сервисов в MVP,
    500+ в v1.1), `user`, `tariff`, `payment`, `notification-rule`.
  - v2: `project`.
- `shared/`:
  - `api/` — `api-client` с refresh-token interceptor (на 401 пробуем
    рефреш через `/auth/refresh`; на повторный 401 — редирект на
    `/login`).
  - `components/`, `contexts/` (`auth`, `theme`, `locale`),
    `hooks/` (`useSession`, `useCurrency`, `useTimezone`,
    `useExchangeRates`).
  - `layouts/`, `lib/` (`env`, `dates-tz`, `money`), `modals/`,
    `types/`, `constants/` (`USD`/`RUB`/`BYN`, периодичности).

Импорты через `@/…` с корнем в `apps/web/src`.

### Time zones (критично)

- Все даты списания храним в Postgres как `timestamptz` (UTC).
- В UI отображаем в `user.timezone` (хранится в профиле; дефолт —
  IANA-имя из браузера при регистрации).
- Никаких `new Date().toISOString().slice(0, 10)` без явной TZ —
  это причина уведомлений в 3 ночи.
- Утилиты: `shared/lib/dates-tz.ts` — `toUserTz(date, tz)`,
  `fromUserTz(date, tz)`. Использовать их и только их.
- Backend (Nest) при планировании email/Telegram-нотификации
  читает `user.timezone` и высчитывает «за N дней» в локальном
  времени юзера, потом конвертирует в UTC для cron.

### i18n

- `next-intl` (App Router-friendly). Ключи живут в `packages/shared/i18n`,
  чтобы веб и backend-нотификации брали одни и те же строки.
- Языки MVP: `ru`, `en`. Дефолт — по `Accept-Language`, переключение
  в header сохраняется в cookie.
- **Никогда** не вставлять пользовательский input в перевод как HTML —
  только как строку (XSS).

### Currencies & exchange rates

- Подписки хранятся в собственной валюте: `USD`, `RUB`, `BYN`.
- Totals в дашборде показываются **по валютам отдельно** + опциональная
  конвертация в основную валюту пользователя.
- Курс — суточный pull с ЦБ РФ (фоновая задача в `apps/api`,
  `@nestjs/schedule`), кеш в Postgres. Фронт берёт через
  `GET /exchange-rates`.
- При недоступности ЦБ — отдаём последний валидный курс с пометкой
  `stale_at`. UI не блокируется.

### PWA

- `manifest.json` + `apple-touch-icon` для add-to-home на iOS — в MVP
  достаточно.
- Service worker — в v1.1 (вместе с Web Push). До этого SW не
  регистрируем.
- Тёмная тема через CSS-переменные + `next-themes`. Без flash при
  cold start (важно для PWA — иначе iOS флешит белым каждое
  открытие).

### Server actions vs Route handlers

- **Server actions** — формы лендинга, регистрации, логина,
  password-reset.
- **Route handlers** — всё, что фронт дёргает из дашборда (CRUD
  подписок, settings).
- Все мутации идут через `apps/api`, **никогда** напрямую в БД из
  Next. Next держит только sessions/cookies + проксирует к Nest.

### What we don't have

- Нет CMS — блог / FAQ / roadmap-страница в v1.1 хранятся в БД
  через `apps/api`, не в Notion / no-code / внешней CMS.
- Нет BFF-слоя — Next дёргает Nest напрямую через `api-client`.
- Нет SSG для дашборда — только SSR + client hydration с auth-cookie.
