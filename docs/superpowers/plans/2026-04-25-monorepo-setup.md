# Monorepo Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert subzero from a single Next.js app into a Yarn 4 + Turborepo monorepo with `apps/web` (relocated Next.js), `apps/api` (new NestJS), and shared `packages/{shared,eslint-config,tsconfig}`. Cross-package types must work in both apps. `yarn dev` must launch both. `yarn lint` and `yarn typecheck` must pass.

**Architecture:** Yarn 4 (Berry) with `nodeLinker: node-modules`, Turborepo for pipelines, project-level `tsconfig` extending shared presets, `@subzero/shared` consumed via TypeScript `paths` to source in dev and `dist/` in prod. Existing `src/` is moved verbatim with `git mv` so FSD layers and history are preserved.

**Tech Stack:** Yarn 4, Turborepo 2, TypeScript 5, Next.js 15.3.1, React 19, NestJS 10, ESLint 8.

---

## File Structure (target)

```
subzero/
├── .yarnrc.yml                       (NEW)
├── .gitignore                        (MODIFY)
├── package.json                      (REWRITE — root workspace)
├── tsconfig.json                     (REWRITE — root, IDE-only)
├── turbo.json                        (NEW)
├── apps/
│   ├── web/
│   │   ├── package.json              (NEW — @subzero/web)
│   │   ├── tsconfig.json             (REWRITE — extends @subzero/tsconfig/nextjs)
│   │   ├── next.config.ts            (MOVE + MODIFY — add transpilePackages)
│   │   ├── next-env.d.ts             (MOVE)
│   │   ├── .eslintrc.cjs             (NEW)
│   │   └── src/                      (MOVE — FSD layout intact)
│   │       └── shared/lib/order-status.ts  (NEW — re-export OrderStatus from @subzero/shared)
│   └── api/
│       ├── package.json              (NEW — @subzero/api)
│       ├── tsconfig.json             (NEW — extends @subzero/tsconfig/nestjs)
│       ├── tsconfig.build.json       (NEW)
│       ├── nest-cli.json             (NEW)
│       ├── .eslintrc.cjs             (NEW)
│       └── src/
│           ├── main.ts               (NEW)
│           ├── app.module.ts         (NEW)
│           └── health/
│               ├── health.module.ts  (NEW)
│               └── health.controller.ts (NEW — uses OrderStatus from @subzero/shared)
└── packages/
    ├── shared/
    │   ├── package.json              (NEW — @subzero/shared)
    │   ├── tsconfig.json             (NEW — composite: true)
    │   └── src/
    │       ├── index.ts              (NEW)
    │       └── enums/
    │           ├── index.ts          (NEW)
    │           └── order-status.enum.ts (NEW)
    ├── eslint-config/
    │   ├── package.json              (NEW — @subzero/eslint-config)
    │   ├── base.js                   (NEW)
    │   ├── next.js                   (NEW)
    │   └── nest.js                   (NEW)
    └── tsconfig/
        ├── package.json              (NEW — @subzero/tsconfig)
        ├── base.json                 (NEW)
        ├── nextjs.json               (NEW)
        └── nestjs.json               (NEW)
```

---

## Phase 0: Pre-flight cleanup

### Task 0.1: Verify clean working tree and snapshot current state

**Files:** none (read-only checks)

- [ ] **Step 1: Confirm clean tree**

Run: `git status --porcelain`
Expected: empty output (no uncommitted changes).

If output is non-empty, STOP and resolve before continuing.

- [ ] **Step 2: Snapshot current root contents for reference**

Run: `ls -la`
Expected: shows current `src/`, `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `yarn.lock`, `node_modules/`, `.next/`, `AGENTS.md`, `CLAUDE.md`, `ai/`, `.gitignore`.

### Task 0.2: Remove build artifacts and old install

**Files:**

- Delete: `.next/`, `node_modules/`, `yarn.lock`

- [ ] **Step 1: Delete build/install artifacts**

Run: `rm -rf .next node_modules yarn.lock`
Expected: no output. These are not in git for `node_modules` / `.next` (per `.gitignore`); `yarn.lock` IS tracked and will be replaced after Yarn 4 install.

- [ ] **Step 2: Stage `yarn.lock` deletion**

Run: `git rm yarn.lock`
Expected: `rm 'yarn.lock'`.

Do NOT commit yet — bundle with Phase 1 commit.

---

## Phase 1: Yarn 4 + root workspace scaffolding

### Task 1.1: Activate Yarn 4 via corepack

**Files:**

- Create: `.yarnrc.yml`

- [ ] **Step 1: Enable corepack and pin Yarn 4 stable**

Run: `corepack enable && corepack prepare yarn@stable --activate`
Expected: prints `Preparing yarn@<4.x.x> for immediate activation...`. Note the exact version printed — it will be written into `package.json` `packageManager` in Task 1.2.

- [ ] **Step 2: Verify Yarn version is 4.x**

Run: `yarn --version`
Expected: `4.x.y` (e.g. `4.5.0`). If still `1.x`, run `corepack enable` again and retry.

- [ ] **Step 3: Create `.yarnrc.yml`**

File: `.yarnrc.yml`

```yaml
nodeLinker: node-modules
enableGlobalCache: true
```

### Task 1.2: Replace root `package.json` with workspace root

**Files:**

- Modify: `package.json` (full rewrite)

- [ ] **Step 1: Read current `package.json`**

Run: `cat package.json`
Expected: shows the existing Next.js manifest (next, react, react-dom). The `next/react/react-dom` deps will move to `apps/web/package.json` in Phase 3 — confirm them in your scratch notes for reuse.

- [ ] **Step 2: Overwrite `package.json` with workspace root**

File: `package.json`

```json
{
  "name": "subzero",
  "version": "0.1.0",
  "private": true,
  "packageManager": "yarn@4.5.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "yarn workspace @subzero/shared build && turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  }
}
```

Note: Replace `4.5.0` with the exact version printed by `yarn --version` in Task 1.1.

### Task 1.3: Add root `turbo.json`

**Files:**

- Create: `turbo.json`

- [ ] **Step 1: Create `turbo.json`**

File: `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", ".env"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Task 1.4: Add root `tsconfig.json` (IDE-only)

**Files:**

- Modify: `tsconfig.json` (full rewrite)

- [ ] **Step 1: Overwrite `tsconfig.json`**

File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@subzero/shared": ["packages/shared/src/index.ts"],
      "@subzero/shared/*": ["packages/shared/src/*"]
    }
  },
  "files": [],
  "include": []
}
```

### Task 1.5: Update root `.gitignore` for monorepo artifacts

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Append monorepo entries**

File: `.gitignore` (append; current contents are `.next/`, `node_modules/`, `.env*.local`, `out/`)
Final content:

```
# Build outputs
.next/
out/
dist/

# Dependencies
node_modules/

# Yarn 4
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
.pnp.*

# Turbo
.turbo/

# Env
.env*.local
.env

# IDE / OS
.DS_Store
```

### Task 1.6: Create `apps/` and `packages/` directories

**Files:**

- Create: `apps/.gitkeep`, `packages/.gitkeep` (placeholders, removed once content lands)

- [ ] **Step 1: Make directories**

Run: `mkdir -p apps packages`
Expected: directories created (no output).

### Task 1.7: Verify Phase 1 and commit

- [ ] **Step 1: Stage and commit root scaffolding**

Run:

```bash
git add .yarnrc.yml package.json turbo.json tsconfig.json .gitignore
git commit -m "chore: bootstrap Yarn 4 workspace and Turborepo root"
```

Expected: commit created; `git status` shows clean.

---

## Phase 2: Shared packages

### Task 2.1: Create `@subzero/tsconfig`

**Files:**

- Create: `packages/tsconfig/package.json`, `packages/tsconfig/base.json`, `packages/tsconfig/nextjs.json`, `packages/tsconfig/nestjs.json`

- [ ] **Step 1: `packages/tsconfig/package.json`**

```json
{
  "name": "@subzero/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "nestjs.json"]
}
```

- [ ] **Step 2: `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: `packages/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 4: `packages/tsconfig/nestjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": false,
    "declarationMap": false,
    "removeComments": true,
    "noUncheckedIndexedAccess": false
  }
}
```

### Task 2.2: Create `@subzero/eslint-config`

**Files:**

- Create: `packages/eslint-config/package.json`, `packages/eslint-config/base.js`, `packages/eslint-config/next.js`, `packages/eslint-config/nest.js`

- [ ] **Step 1: `packages/eslint-config/package.json`**

```json
{
  "name": "@subzero/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "base.js",
  "files": ["base.js", "next.js", "nest.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^8.10.0",
    "@typescript-eslint/parser": "^8.10.0",
    "eslint-config-next": "15.3.1"
  },
  "peerDependencies": {
    "eslint": "^8.57.0"
  }
}
```

- [ ] **Step 2: `packages/eslint-config/base.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  ignorePatterns: ['dist/', '.next/', 'node_modules/', '*.config.js', '*.config.ts'],
};
```

- [ ] **Step 3: `packages/eslint-config/next.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js', 'next/core-web-vitals'],
  env: {
    browser: true,
    node: true,
  },
};
```

- [ ] **Step 4: `packages/eslint-config/nest.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
  },
};
```

### Task 2.3: Create `@subzero/shared` with the `OrderStatus` smoke-test enum

**Files:**

- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/enums/index.ts`, `packages/shared/src/enums/order-status.enum.ts`

- [ ] **Step 1: `packages/shared/package.json`**

```json
{
  "name": "@subzero/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch --preserveWatchOutput",
    "clean": "rm -rf dist .turbo",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@subzero/eslint-config": "workspace:*",
    "@subzero/tsconfig": "workspace:*",
    "eslint": "^8.57.0",
    "typescript": "^5.6.0"
  }
}
```

Note: at runtime (Nest after `nest build` → `node dist/main.js`), `@subzero/shared` is resolved through the workspace symlink in `node_modules` to this package's `dist/`. In TypeScript and in Next's bundler (via `transpilePackages` + tsconfig `paths`), apps see source. `dev` runs `tsc -b --watch` so `dist/` stays fresh while editing — and the root `yarn dev` script runs a one-shot `yarn workspace @subzero/shared build` first so `dist/` exists before `apps/api` boots.

- [ ] **Step 2: `packages/shared/tsconfig.json`**

```json
{
  "extends": "@subzero/tsconfig/base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: `packages/shared/src/enums/order-status.enum.ts`**

```ts
export enum OrderStatus {
  NEW = 'NEW',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
```

- [ ] **Step 4: `packages/shared/src/enums/index.ts`**

```ts
export * from './order-status.enum';
```

- [ ] **Step 5: `packages/shared/src/index.ts`**

```ts
export * from './enums';
```

- [ ] **Step 6: Add `.eslintrc.cjs` for `@subzero/shared`**

File: `packages/shared/.eslintrc.cjs`

```js
module.exports = {
  root: true,
  extends: ['@subzero/eslint-config'],
};
```

### Task 2.4: Commit Phase 2

- [ ] **Step 1: Stage and commit**

Run:

```bash
git add packages/
git commit -m "feat(packages): add shared, eslint-config, and tsconfig packages"
```

Expected: commit created.

---

## Phase 3: Relocate Next.js into `apps/web`

### Task 3.1: Move existing files into `apps/web/` with `git mv`

**Files (moved, history preserved):**

- `src/` → `apps/web/src/`
- `next.config.ts` → `apps/web/next.config.ts`
- `next-env.d.ts` → `apps/web/next-env.d.ts`
- `tsconfig.json` (current root copy) — already overwritten in Task 1.4; `apps/web` gets a new tsconfig in Task 3.3.
- `subszero-front.iml` stays at root (IntelliJ project file).

- [ ] **Step 1: Create `apps/web` directory**

Run: `mkdir -p apps/web`

- [ ] **Step 2: `git mv` the source tree**

Run:

```bash
git mv src apps/web/src
git mv next.config.ts apps/web/next.config.ts
git mv next-env.d.ts apps/web/next-env.d.ts
```

Expected: `git status` shows three renamed paths under `apps/web/`.

### Task 3.2: Create `apps/web/package.json`

**Files:**

- Create: `apps/web/package.json`

- [ ] **Step 1: Write `apps/web/package.json`**

```json
{
  "name": "@subzero/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next .turbo"
  },
  "dependencies": {
    "@subzero/shared": "workspace:*",
    "next": "15.3.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@subzero/eslint-config": "workspace:*",
    "@subzero/tsconfig": "workspace:*",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^8.57.0",
    "eslint-config-next": "15.3.1",
    "typescript": "^5.6.0"
  }
}
```

### Task 3.3: Replace `apps/web/tsconfig.json`

**Files:**

- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Write the file**

```json
{
  "extends": "@subzero/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@subzero/shared": ["../../packages/shared/src/index.ts"],
      "@subzero/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

### Task 3.4: Update `apps/web/next.config.ts` to transpile `@subzero/shared`

**Files:**

- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Read current contents**

Run: `cat apps/web/next.config.ts`
Expected:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: Replace contents**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@subzero/shared'],
};

export default nextConfig;
```

### Task 3.5: Add `apps/web/.eslintrc.cjs`

**Files:**

- Create: `apps/web/.eslintrc.cjs`

- [ ] **Step 1: Write the file**

```js
module.exports = {
  root: true,
  extends: ['@subzero/eslint-config/next'],
};
```

### Task 3.6: Add OrderStatus smoke-test usage in `apps/web`

**Files:**

- Create: `apps/web/src/shared/lib/order-status.ts`

- [ ] **Step 1: Verify the target directory exists**

Run: `ls apps/web/src/shared/lib/ 2>/dev/null || ls apps/web/src/shared/ 2>/dev/null`
Expected: directory listing (FSD `shared/lib` should exist per ai/ctx-frontend-fsd.md). If `lib/` is missing, create it with `mkdir -p apps/web/src/shared/lib`.

- [ ] **Step 2: Write the re-export**

File: `apps/web/src/shared/lib/order-status.ts`

```ts
export { OrderStatus } from '@subzero/shared';
```

This file exists solely to satisfy the acceptance criterion that cross-package types resolve in `apps/web`. It is harmless and can be expanded into real domain code later.

### Task 3.7: Commit Phase 3

- [ ] **Step 1: Stage and commit**

Run:

```bash
git add apps/web
git commit -m "refactor: relocate Next.js app into apps/web and wire shared packages"
```

Expected: commit shows renames (preserving history) and the new files.

---

## Phase 4: Scaffold NestJS into `apps/api`

This phase scaffolds NestJS files manually (skipping `nest new` to avoid its self-installer fighting the workspace).

### Task 4.1: Create `apps/api/package.json`

**Files:**

- Create: `apps/api/package.json`

- [ ] **Step 1: Write the file**

```json
{
  "name": "@subzero/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\" --max-warnings 0",
    "test": "jest --passWithNoTests",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/config": "^3.2.3",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@subzero/shared": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.5",
    "@nestjs/schematics": "^10.2.3",
    "@subzero/eslint-config": "workspace:*",
    "@subzero/tsconfig": "workspace:*",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.13",
    "@types/node": "^20",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.6.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node"
  }
}
```

### Task 4.2: Create `apps/api/tsconfig.json` and `tsconfig.build.json`

**Files:**

- Create: `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`

- [ ] **Step 1: `apps/api/tsconfig.json`**

```json
{
  "extends": "@subzero/tsconfig/nestjs.json",
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist",
    "incremental": true,
    "paths": {
      "@subzero/shared": ["../../packages/shared/src/index.ts"],
      "@subzero/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: `apps/api/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### Task 4.3: Create `apps/api/nest-cli.json`

**Files:**

- Create: `apps/api/nest-cli.json`

- [ ] **Step 1: Write the file**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "tsConfigPath": "tsconfig.build.json",
    "deleteOutDir": true
  }
}
```

### Task 4.4: Create `apps/api/.eslintrc.cjs`

**Files:**

- Create: `apps/api/.eslintrc.cjs`

- [ ] **Step 1: Write the file**

```js
module.exports = {
  root: true,
  extends: ['@subzero/eslint-config/nest'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/', 'node_modules/', '.eslintrc.cjs'],
};
```

### Task 4.5: Create the Nest source files

**Files:**

- Create: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/health/health.module.ts`, `apps/api/src/health/health.controller.ts`

- [ ] **Step 1: `apps/api/src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = Number(config.get<string>('API_PORT') ?? 3001);
  const webOrigin = config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: webOrigin, credentials: true });

  await app.listen(port);

  console.log(`api listening on http://localhost:${port}/api`);
}

bootstrap();
```

- [ ] **Step 2: `apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule],
})
export class AppModule {}
```

- [ ] **Step 3: `apps/api/src/health/health.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 4: `apps/api/src/health/health.controller.ts`** (uses `OrderStatus` to satisfy cross-package import smoke test)

```ts
import { Controller, Get } from '@nestjs/common';
import { OrderStatus } from '@subzero/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; uptime: number; sampleStatuses: OrderStatus[] } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      sampleStatuses: [OrderStatus.NEW, OrderStatus.PAID],
    };
  }
}
```

### Task 4.6: Commit Phase 4

- [ ] **Step 1: Stage and commit**

Run:

```bash
git add apps/api
git commit -m "feat(api): scaffold NestJS app with health endpoint and shared types"
```

Expected: commit created.

---

## Phase 5: Install, verify acceptance criteria, finalize

### Task 5.1: Install all dependencies

- [ ] **Step 1: Run install**

Run: `yarn install`
Expected: Yarn 4 resolves all workspaces, generates `yarn.lock`, populates `node_modules` at root and per-workspace symlinks. No `ERR` lines. Warnings about peer deps are OK.

- [ ] **Step 2: Stage the new lockfile**

Run: `git add yarn.lock .yarn/`
Expected: lockfile staged.

### Task 5.2: Verify cross-package typecheck

- [ ] **Step 1: Build the shared package once (so its `dist/` exists for any tooling that reads `exports`)**

Run: `yarn workspace @subzero/shared build`
Expected: `tsc -b` exits 0. `packages/shared/dist/index.js` and `index.d.ts` exist.

- [ ] **Step 2: Run repo-wide typecheck**

Run: `yarn typecheck`
Expected: Turbo runs `typecheck` for `@subzero/shared`, `@subzero/web`, `@subzero/api`. All exit 0. No `error TS` lines.

If `@subzero/shared` cannot be resolved by web/api, double-check that `paths` in their `tsconfig.json` point to `../../packages/shared/src/index.ts`.

### Task 5.3: Verify lint passes

- [ ] **Step 1: Run lint**

Run: `yarn lint`
Expected: Turbo runs `lint` for each workspace. All exit 0. No `error` lines.

If `eslint-config-next` complains about missing peer dep, ensure `eslint` is in `apps/web/devDependencies`.

### Task 5.4: Verify `yarn dev` launches both apps

- [ ] **Step 1: Start dev in the background**

Run: `yarn dev > /tmp/subzero-dev.log 2>&1 &`
Wait ~15 seconds for both apps to come up (`sleep 15`).

- [ ] **Step 2: Check the web app**

Run: `curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3000`
Expected: `200`.

- [ ] **Step 3: Check the api health endpoint**

Run: `curl -sf http://localhost:3001/api/health`
Expected: JSON containing `"status":"ok"`, `"uptime":<number>`, and `"sampleStatuses":["NEW","PAID"]`.

- [ ] **Step 4: Stop the dev process**

Run: `kill %1 2>/dev/null; wait 2>/dev/null; pkill -f 'next dev' 2>/dev/null; pkill -f 'nest start' 2>/dev/null; true`
Expected: dev processes terminated; subsequent `lsof -i :3000 -i :3001` returns empty.

### Task 5.5: Verify production build also works

- [ ] **Step 1: Run repo build**

Run: `yarn build`
Expected: `@subzero/shared` builds first (Turbo dep order), then `@subzero/web` (Next.js build) and `@subzero/api` (`nest build`). All exit 0. `apps/web/.next/`, `apps/api/dist/`, `packages/shared/dist/` populated.

### Task 5.6: Update `AGENTS.md` to reflect Yarn 4 + workspaces

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Read current `AGENTS.md`**

Run: `cat AGENTS.md`

- [ ] **Step 2: Edit the "Rules" line about yarn**

Replace:

```
- Use yarn instead of npm.
```

With:

```
- Use yarn (Yarn 4 / Berry, configured at the workspace root). All commands run from repo root via `yarn <script>` or `yarn workspace @subzero/<name> <script>`.
```

- [ ] **Step 3: Append a "Monorepo layout" pointer to the Project section**

Add at the end of the `### Project` section (after the existing single-line description):

```
The repo is a Yarn 4 monorepo orchestrated by Turborepo:
- `apps/web` — Next.js 15 frontend (FSD layout in `src/`).
- `apps/api` — NestJS 10 backend.
- `packages/shared` — cross-app TypeScript types/enums (e.g. `OrderStatus`).
- `packages/eslint-config`, `packages/tsconfig` — shared lint and TS presets.
```

### Task 5.7: Final verification re-run and commit

- [ ] **Step 1: Re-run lint, typecheck, build to confirm green state**

Run: `yarn lint && yarn typecheck && yarn build`
Expected: all three exit 0.

- [ ] **Step 2: Stage and commit**

Run:

```bash
git add yarn.lock .yarn AGENTS.md
git commit -m "chore: install workspace deps and document monorepo in AGENTS.md"
```

Expected: commit created. `git status` clean.

- [ ] **Step 3: Final summary check**

Run: `git log --oneline -10`
Expected: see Phase 1, 2, 3, 4, 5 commits in order plus the design-spec commit.

Run: `git status`
Expected: `working tree clean`.

---

## Acceptance criteria mapping

| Criterion                                                                        | Verified in                                    |
| -------------------------------------------------------------------------------- | ---------------------------------------------- |
| `yarn dev` launches both web (3000) and api (3001)                               | Task 5.4                                       |
| TypeScript paths work between packages (`@subzero/shared` imported in both apps) | Tasks 3.6, 4.5 (sources) + 5.2 (typecheck)     |
| No linter errors                                                                 | Task 5.3                                       |
| Production build also works                                                      | Task 5.5                                       |
| Existing FSD structure preserved in `apps/web/src`                               | Task 3.1 (git mv preserves layout and history) |
