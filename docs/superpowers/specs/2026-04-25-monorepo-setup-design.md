# Monorepo Setup — Design Spec

**Date:** 2026-04-25
**Status:** Archived (superseded 2026-05-03)
**Topic:** Reorganize subzero project as a Yarn 4 + Turborepo monorepo with shared packages between Next.js web and NestJS api.

> **ARCHIVED (2026-05-03).** Спека описывает _изначальный_ выбор стэка: Yarn 4 (Berry) и open question по ORM (Prisma vs TypeORM vs Drizzle). После реализации проект мигрировал на **Yarn 1.x classic** и **Drizzle ORM**. Актуальное состояние стэка — `AGENTS.md`, `README.md`. Документ оставлен для исторической трассировки решений.

## Goal

Convert the current single-app Next.js project into a monorepo that hosts:

- the existing Next.js frontend (`apps/web`),
- a new NestJS backend (`apps/api`),
- shared TypeScript packages consumed by both apps.

A single `yarn dev` must launch both apps. TypeScript path mappings must work across packages. Linter must pass with zero errors.

## Non-goals

Out of scope for this spec (will be follow-up work):

- Database, ORM, migrations in `apps/api`.
- Swagger / OpenAPI generation.
- Business modules (orders, products, etc.) — only a health endpoint exists in `apps/api` after this work.
- Refactoring of the FSD structure inside `apps/web`.
- CI configuration (GitHub Actions, etc.).
- Docker / deployment changes.

## Tooling decisions

| Decision        | Choice                                                       | Rationale                                                                                                                                                  |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager | **Yarn 4 (Berry)** with `nodeLinker: node-modules`           | Required by `AGENTS.md` (yarn over npm). Berry gives modern workspace tooling; `node-modules` linker keeps Next.js / Nest.js working without PnP friction. |
| Task runner     | **Turborepo**                                                | Required by task. Provides parallel `dev`, dependency-aware `build`, caching for `lint`/`test`/`typecheck`.                                                |
| Workspaces glob | `apps/*`, `packages/*`                                       | Standard split between deployables and libraries.                                                                                                          |
| TypeScript      | Project references with `composite: true` on shared packages | Enables incremental builds and correct cross-package type checking.                                                                                        |

## Directory structure

```
subzero/
├── apps/
│   ├── web/                    ← existing Next.js (relocated)
│   │   ├── src/                ← FSD as before (app, _pages, widgets, ...)
│   │   ├── next.config.ts
│   │   ├── next-env.d.ts
│   │   ├── tsconfig.json
│   │   ├── .eslintrc.cjs
│   │   └── package.json        ← name: "@subzero/web"
│   └── api/                    ← new NestJS app
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── app.controller.ts
│       │   └── health/health.controller.ts
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── nest-cli.json
│       ├── .eslintrc.cjs
│       └── package.json        ← name: "@subzero/api"
├── packages/
│   ├── shared/                 ← @subzero/shared
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── enums/
│   │   │       ├── index.ts
│   │   │       └── order-status.enum.ts
│   │   ├── tsconfig.json       ← composite: true
│   │   └── package.json
│   ├── eslint-config/          ← @subzero/eslint-config
│   │   ├── base.js
│   │   ├── next.js
│   │   ├── nest.js
│   │   └── package.json
│   └── tsconfig/               ← @subzero/tsconfig
│       ├── base.json
│       ├── nextjs.json
│       ├── nestjs.json
│       └── package.json
├── docs/
├── turbo.json
├── package.json                ← root, workspaces, packageManager: yarn@4.x
├── tsconfig.json               ← root, IDE-only, references all packages
├── .yarnrc.yml                 ← nodeLinker: node-modules
├── .gitignore                  ← extended for monorepo
└── yarn.lock
```

## Component contracts

### `@subzero/shared`

- **Purpose:** typed values shared by both apps (enums, DTO shapes, response envelopes — added on demand later).
- **Public API (initial):** `export { OrderStatus } from "./enums/order-status.enum"`.
- **OrderStatus initial members:** `NEW`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`. Used as a smoke test for cross-package types — actual workflow is out of scope.
- **Exports field:** `package.json` declares both `main`/`types` and `exports` map. In dev, consumers resolve to `src/index.ts` via TS `paths`; production builds use `dist/`.
- **No runtime dependencies.** TypeScript-only package.

### `@subzero/tsconfig`

- **base.json:** `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `skipLibCheck: true`, `esModuleInterop: true`, `isolatedModules: true`.
- **nextjs.json:** extends base; `jsx: preserve`, `lib: [dom, dom.iterable, esnext]`, `moduleResolution: bundler`, `plugins: [{name: "next"}]`, `paths: {"@/*": ["./src/*"], "@subzero/shared": ["../../packages/shared/src/index.ts"]}`.
- **nestjs.json:** extends base; `module: commonjs`, `moduleResolution: node`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `target: ES2022`, `paths: {"@subzero/shared": ["../../packages/shared/src/index.ts"]}`.
- Apps extend the relevant preset and only override `outDir`/`rootDir`/`include`.

### `@subzero/eslint-config`

- **base.js:** `@typescript-eslint/parser` + `@typescript-eslint/recommended` + Prettier-compatible disables. No formatting rules (Prettier owns formatting if used later).
- **next.js:** extends base + `next/core-web-vitals`.
- **nest.js:** extends base + Node globals + relaxed import rules suitable for decorators.
- Apps' `.eslintrc.cjs` only `extends: ["@subzero/eslint-config/next"]` (or `/nest`).

### `apps/web` (`@subzero/web`)

- Contents of current `src/` move verbatim. FSD layers preserved (`app/`, `_pages/`, `widgets/`, `features/`, `entities/`, `shared/`).
- `next.config.ts` adds `transpilePackages: ["@subzero/shared"]` so Next compiles the shared package source directly.
- Existing `@/*` alias preserved (rooted at `apps/web/src`).
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
- Default port **3000**.

### `apps/api` (`@subzero/api`)

- Generated via `nest new api --skip-git --skip-install --strict --package-manager yarn`, then trimmed and merged into the workspace.
- `main.ts` reads `API_PORT` (default `3001`) and `WEB_ORIGIN` (default `http://localhost:3000`) from `ConfigService`. Enables global `ValidationPipe({whitelist: true, transform: true})` and CORS for the web origin.
- `health/health.controller.ts` exposes `GET /api/health` returning `{status: "ok", uptime: number}`. The controller imports `OrderStatus` from `@subzero/shared` (purely as the cross-package wiring smoke test required by acceptance criteria).
- Global route prefix `api` set in `main.ts`.
- Scripts: `dev` (`nest start --watch`), `build` (`nest build`), `start` (`node dist/main.js`), `lint`, `test` (jest scaffold left in place), `typecheck`.
- Default port **3001**.

## Cross-package type resolution

Resolution strategy is path-based in dev and exports-based in production:

1. **Dev / typecheck:** root `tsconfig.json` (IDE) and each app's `tsconfig.json` declare `paths: {"@subzero/shared": ["../../packages/shared/src/index.ts"]}`. Next.js bundler picks this up via `transpilePackages` + `tsconfig paths`. Nest's `tsc` watcher picks it up via `tsconfig-paths` (registered through `nest-cli.json` `tsConfigPath`).
2. **Production build:** `packages/shared` builds to `dist/` via `tsc -b`. Its `package.json` `exports` map points consumers at `dist/index.js` and `dist/index.d.ts`. Turborepo's `build` task ensures `^build` (shared) runs before app builds.

## `turbo.json` pipelines

| Task        | `dependsOn`  | `outputs`                                | `cache` | `persistent` |
| ----------- | ------------ | ---------------------------------------- | ------- | ------------ |
| `dev`       | —            | —                                        | false   | true         |
| `build`     | `^build`     | `.next/**`, `!.next/cache/**`, `dist/**` | true    | false        |
| `lint`      | —            | —                                        | true    | false        |
| `typecheck` | `^typecheck` | —                                        | true    | false        |
| `test`      | `^build`     | `coverage/**`                            | true    | false        |

## Root scripts

`package.json` exposes these scripts (all delegate to Turbo):

- `yarn dev` → `turbo run dev` (parallel persistent run of web and api)
- `yarn build` → `turbo run build`
- `yarn lint` → `turbo run lint`
- `yarn typecheck` → `turbo run typecheck`
- `yarn test` → `turbo run test`

## Migration plan summary

The implementation plan (next document) will cover the move in this order, but the high-level shape is:

1. Add Yarn 4 setup at root (`packageManager`, `.yarnrc.yml`, drop old `yarn.lock`).
2. Create `packages/tsconfig`, `packages/eslint-config`, `packages/shared` skeletons.
3. Relocate the current Next.js project into `apps/web` (using `git mv` to preserve history). Rewrite its `package.json`, `tsconfig.json`, `.eslintrc.cjs` to consume shared packages.
4. Generate NestJS into `apps/api`, integrate it the same way.
5. Add root `package.json`, `turbo.json`, root `tsconfig.json`.
6. `yarn install` once at root, then verify acceptance criteria.

## Acceptance criteria & verification

| Criterion                              | Verification                                                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn dev` launches both apps          | After `yarn install`, run `yarn dev`. `curl http://localhost:3000` returns the Next.js home page; `curl http://localhost:3001/api/health` returns `{"status":"ok",...}`.         |
| TypeScript paths work between packages | `apps/web` has at least one file importing `OrderStatus` from `@subzero/shared`; same in `apps/api/src/health/health.controller.ts`. `yarn typecheck` passes for the whole repo. |
| No linter errors                       | `yarn lint` exits 0 across all workspaces.                                                                                                                                       |

## Risks and mitigations

| Risk                                          | Mitigation                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Yarn 4 + Next.js 15 corepack quirks           | Pin `packageManager: "yarn@4.x"`, use `nodeLinker: node-modules`, avoid PnP. Test `yarn dev` immediately after install.     |
| Nest's CLI assumes its own tsconfig layout    | Keep `tsconfig.build.json` in `apps/api`; have `nest-cli.json` point at it. Don't try to make Nest read project references. |
| Cross-package imports broken at Next build    | Use `transpilePackages: ["@subzero/shared"]` in `next.config.ts`; verify with `yarn build` not just `yarn dev`.             |
| Loss of git history when relocating files     | Use `git mv` for every relocated file.                                                                                      |
| `.next/` build artifact committed by accident | Add `.next/`, `dist/`, `.turbo/` to `.gitignore` before first commit.                                                       |

## Open follow-ups (not in this spec)

- Decide on Prettier vs. native ESLint formatting.
- Decide DB/ORM stack for `apps/api` (Prisma vs. TypeORM vs. Drizzle).
- Add CI pipeline that runs `yarn lint && yarn typecheck && yarn build`.
- Add Docker setup for production deployment of `apps/api`.
