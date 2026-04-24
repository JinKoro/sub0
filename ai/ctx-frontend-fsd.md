### Frontend — Feature-Sliced Design

`/src` uses FSD layers:

- `app/` — Next.js App Router.
- `_pages/` — page-level compositions (main, catalog, product, blog, cooperation, …). Note the leading underscore (the `pages` name is reserved by Next).
- `widgets/` — large composite UI blocks (header, footer, home-page, showroom-page, contact-widget, notification, yandex-map, …).
- `features/` — user-facing interactions (`add-product-to-cart`, `contact-form`, `feedback-form`, `product-customization`, `dev-guard`, …).
- `entities/` — domain models and their UI (`product`, `product-category`, `cart`, `article`, `blog`, `feedback`).
- `shared/` — `api/` (bff-client, strapi-client, api-client), `components/`, `contexts/`, `hooks/`, `layouts/`, `lib/`, `mocks/`, `modals/`, `types/`, `constants/`.

Imports use the `@/…` alias rooted at `src`. SEO metadata is generated centrally via `shared/lib` (`generateSeoMetadata`, `viewport`). GTM id comes from `NEXT_PUBLIC_GTM_ID`.
