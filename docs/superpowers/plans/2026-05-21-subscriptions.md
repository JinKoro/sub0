# Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Связать UI «Подписки» с реальным API (CRUD + список с серверной пагинацией/фильтрами), добавить bulk red-zone «Удалить все подписки», и API словарей `categories`/`services`. Backfill `billing_history` при создании подписки с прошлой датой первого списания.

**Architecture:** Бэкенд — три новых NestJS-модуля (`category`, `service`, `subscription`) и одна доп. ручка в `CustomerController`. Доменные правила (XOR категории, promo/trial, backfill, optimistic locking) — в `SubscriptionService`, по канону существующих модулей (`project`/`customer`). Фронт — три новых FSD-слайса (`entities/{category,service,subscription/api}`) + переписанный `_pages/subscriptions` под URL-state и серверную пагинацию + features `delete-subscription`/`delete-all-subscriptions`. Spec: `docs/superpowers/specs/2026-05-21-subscriptions-design.md`.

**Tech Stack:** NestJS 10, Drizzle, Postgres, class-validator, supertest, jest. Next.js 15 App Router, FSD, next-intl.

---

## File Structure

### Backend (`apps/api`)

Создаём:
- `src/category/category.module.ts`, `category.controller.ts`, `category.service.ts`, `category.repository.ts`, `category.types.ts`
- `src/service/service.module.ts`, `service.controller.ts`, `service.service.ts`, `service.repository.ts`, `service.types.ts`, `dto/list-services.dto.ts`
- `src/subscription/subscription.module.ts`, `subscription.controller.ts`, `subscription.service.ts`, `subscription.repository.ts`, `subscription.types.ts`, `subscription.service.spec.ts`, `subscription.e2e.int.spec.ts`
- `src/subscription/dto/{create-subscription,update-subscription,list-subscriptions}.dto.ts`
- `src/subscription/billing-cycle.ts` — вспом. чистая функция: вычисление `cycles`, `nextBillingDate`, `period_start/end`.

Модифицируем:
- `src/app.module.ts` — добавить `CategoryModule`, `ServiceModule`, `SubscriptionModule`.
- `src/customer/customer.controller.ts` — добавить `DELETE /customers/me/subscriptions`.
- `src/customer/customer.service.ts` — метод `purgeSubscriptions(id)`.
- `src/customer/customer.types.ts` — расширить `CustomerRepository` или ввести новый интерфейс `CustomerDataPurger` (см. Task 13).
- `src/customer/customer.repository.ts` — реализация purge.
- `src/customer/customer.module.ts` — провайдер.

### Shared (`packages/shared`)

Создаём:
- `src/dto/subscription.ts`, `src/dto/service.ts`, `src/dto/category.ts`
- `src/dto/index.ts` — re-exports
- `src/index.ts` — добавить `export * from './dto'`

### Frontend (`apps/web`)

Создаём:
- `src/shared/api/category.ts`, `src/shared/api/service.ts`, `src/shared/api/subscription.ts`
- `src/entities/category/api/list.ts`, `src/entities/category/model/types.ts`
- `src/entities/service/api/list.ts`, `src/entities/service/model/types.ts`
- `src/entities/subscription/api/{list,get,create,update,remove,purge}.ts`
- `src/features/delete-subscription/ui/DeleteSubscriptionButton.tsx`
- `src/features/delete-all-subscriptions/ui/DeleteAllSubscriptionsAction.tsx`

Модифицируем:
- `src/entities/subscription/model/types.ts` — реальные UI-типы поверх `SubscriptionDto`.
- Удаляем `src/entities/subscription/model/cabinet-mock.ts` (и `cabinet-types.ts` если не используется), очищаем зависимости в `_pages/subscriptions/ui/*`.
- `src/_pages/subscriptions/ui/SubscriptionsPage.tsx` — переключить с моков на API.
- `src/_pages/subscriptions/ui/SubsListView.tsx` — URL-state + серверная пагинация, loading/empty/error.
- `src/features/subscription-form/ui/SubscriptionForm.tsx` — реальные сервисы/категории, submit на API.
- `src/features/subscription-form/ui/ServicePickerInline.tsx` — данные из API.
- `src/_pages/settings/ui/SettingsAccount.tsx` — подключить `DeleteAllSubscriptionsAction` к существующей кнопке.

### Docs

- Уже обновлены: `ai/ctx-business-logic.md`, `ai/ctx-architecture.md`, `docs/sub0-roadmap.md`. План эти файлы больше не трогает.

---

## Task Sequencing Principles

- Каждый таск — самодостаточный коммит, после которого `yarn test` (api или web) проходит.
- Шаги внутри таска: red → green → refactor → commit (TDD), для бэка.
- Префикс коммитов — `#<issue>: ...`. Issue номер придёт при старте; в плане плейсхолдер `#83`.
- Когда таск только UI без логики — пишем сначала компонент, потом ручную верификацию в браузере (`yarn dev`).

---

## Task 1: Shared DTO для category / service / subscription

**Files:**
- Create: `packages/shared/src/dto/category.ts`
- Create: `packages/shared/src/dto/service.ts`
- Create: `packages/shared/src/dto/subscription.ts`
- Create: `packages/shared/src/dto/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Создать `packages/shared/src/dto/category.ts`**

```ts
export interface CategoryDto {
  sku: string;
  nameRu: string;
  nameEn: string;
  color: string | null;
}
```

- [ ] **Step 2: Создать `packages/shared/src/dto/service.ts`**

```ts
export interface ServiceDto {
  sku: string;
  name: string;
  icon: string | null;
  categorySku: string;
  cancelUrl: string | null;
  pricingUrl: string | null;
}

export interface ServiceListResponse {
  items: ServiceDto[];
  total: number;
}
```

- [ ] **Step 3: Создать `packages/shared/src/dto/subscription.ts`**

```ts
import type { BillingPeriod, Currency, SubscriptionState } from '../enums';

/** Public response shape — see ctx-business-logic.md «имя и иконка». */
export interface SubscriptionDto {
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  /** Resolved (service.name OR name_custom). */
  name: string;
  /** Resolved (service.icon OR icon_custom). */
  icon: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  /** Numeric (12,2) → string (avoid JS float drift). */
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  nextBillingDate: string;
  isTrial: boolean;
  promoAmount: string | null;
  promoEndsAt: string | null;
  comment: string | null;
  stateId: SubscriptionState;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionCreateDto {
  projectSku: string;
  serviceSku?: string | null;
  nameCustom?: string | null;
  iconCustom?: string | null;
  categorySku: string;
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  isTrial: boolean;
  promoAmount?: string | null;
  promoEndsAt?: string | null;
  comment?: string | null;
}

export type SubscriptionUpdateDto = Partial<SubscriptionCreateDto> & {
  version: number;
  /** Only ACTIVE | PAUSED | CANCELLED; ARCHIVED ставится только через DELETE. */
  stateId?: SubscriptionState;
};

export type SubscriptionListStatus =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'archived'
  | 'all';

export type SubscriptionListSort = 'next' | 'name' | 'price';

export interface SubscriptionListQuery {
  projectSku?: string | 'all';
  status?: SubscriptionListStatus;
  categorySku?: string;
  q?: string;
  sort?: SubscriptionListSort;
  page?: number;
  pageSize?: number;
}

export interface SubscriptionListResponse {
  items: SubscriptionDto[];
  total: number;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 4: Создать `packages/shared/src/dto/index.ts`**

```ts
export * from './category';
export * from './service';
export * from './subscription';
```

- [ ] **Step 5: Расширить `packages/shared/src/index.ts`**

Добавить новую строку в конец файла:

```ts
export * from './dto';
```

- [ ] **Step 6: Typecheck**

Run: `yarn workspace @subzero/shared build || yarn typecheck` (если есть build — иначе пропустить).
Expected: успех. Если в shared нет build-скрипта, проверка пройдёт на consumer-стороне в Task 2+.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/dto packages/shared/src/index.ts
git commit -m "#83: shared DTO для category/service/subscription"
```

---

## Task 2: Backend — CategoryModule (`GET /categories`)

**Files:**
- Create: `apps/api/src/category/category.types.ts`
- Create: `apps/api/src/category/category.repository.ts`
- Create: `apps/api/src/category/category.service.ts`
- Create: `apps/api/src/category/category.controller.ts`
- Create: `apps/api/src/category/category.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: `category.types.ts`**

```ts
import type { CategoryDto } from '@subzero/shared';

export interface CategoryRepository {
  listAll(): Promise<CategoryDto[]>;
}
```

- [ ] **Step 2: `category.repository.ts`**

```ts
import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { CategoryDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { category } from '../db/schema/category';
import type { CategoryRepository } from './category.types';

@Injectable()
export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listAll(): Promise<CategoryDto[]> {
    const rows = await this.db
      .select({
        sku: category.sku,
        nameRu: category.nameRu,
        nameEn: category.nameEn,
        color: category.color,
      })
      .from(category)
      .orderBy(asc(category.nameRu));
    return rows.map((r) => ({ ...r, color: r.color ?? null }));
  }
}
```

- [ ] **Step 3: `category.service.ts`**

```ts
import type { CategoryDto } from '@subzero/shared';

import type { CategoryRepository } from './category.types';

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  list(): Promise<CategoryDto[]> {
    return this.repo.listAll();
  }
}
```

- [ ] **Step 4: `category.controller.ts`**

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { CategoryDto } from '@subzero/shared';

import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list(): Promise<CategoryDto[]> {
    return this.categories.list();
  }
}
```

- [ ] **Step 5: `category.module.ts`**

```ts
import { Module } from '@nestjs/common';

import { CategoryController } from './category.controller';
import { DrizzleCategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [
    DrizzleCategoryRepository,
    {
      provide: CategoryService,
      useFactory: (repo: DrizzleCategoryRepository) => new CategoryService(repo),
      inject: [DrizzleCategoryRepository],
    },
  ],
})
export class CategoryModule {}
```

- [ ] **Step 6: Подключить `CategoryModule` в `apps/api/src/app.module.ts`**

В `imports: [...]` добавить `CategoryModule`:

```ts
import { CategoryModule } from './category/category.module';
// ...
imports: [
  ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
  ScheduleModule.forRoot(),
  DbModule,
  HealthModule,
  AuthModule,
  CustomerModule,
  MailModule,
  ProjectModule,
  CategoryModule,
],
```

- [ ] **Step 7: Запустить API и проверить ручку вручную**

Run: `yarn workspace @subzero/api dev` → в другом терминале:
`curl -s -b cookie.txt http://localhost:3001/api/v1/categories` (после логина).
Expected: JSON-массив системных категорий из seed.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/category apps/api/src/app.module.ts
git commit -m "#83: GET /categories — список системных категорий"
```

---

## Task 3: Backend — ServiceModule (`GET /services`)

**Files:**
- Create: `apps/api/src/service/service.types.ts`
- Create: `apps/api/src/service/dto/list-services.dto.ts`
- Create: `apps/api/src/service/service.repository.ts`
- Create: `apps/api/src/service/service.service.ts`
- Create: `apps/api/src/service/service.controller.ts`
- Create: `apps/api/src/service/service.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: `service.types.ts`**

```ts
import type { ServiceDto } from '@subzero/shared';

export interface ServiceFilter {
  categorySku?: string;
  q?: string;
  limit: number;
}

export interface ServiceRepository {
  listActive(filter: ServiceFilter): Promise<{ items: ServiceDto[]; total: number }>;
}
```

- [ ] **Step 2: `service/dto/list-services.dto.ts`**

```ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListServicesDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categorySku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
```

- [ ] **Step 3: `service.repository.ts`**

```ts
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, sql, type SQL } from 'drizzle-orm';
import type { ServiceDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { category } from '../db/schema/category';
import { service } from '../db/schema/service';
import type { ServiceFilter, ServiceRepository } from './service.types';

@Injectable()
export class DrizzleServiceRepository implements ServiceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listActive(
    filter: ServiceFilter,
  ): Promise<{ items: ServiceDto[]; total: number }> {
    const where: SQL[] = [eq(service.isActive, true)];
    if (filter.categorySku) where.push(eq(category.sku, filter.categorySku));
    if (filter.q) where.push(ilike(service.name, `%${filter.q}%`));

    const whereExpr = where.length === 1 ? where[0] : and(...where);

    const items = await this.db
      .select({
        sku: service.sku,
        name: service.name,
        icon: service.icon,
        categorySku: category.sku,
        cancelUrl: service.cancelUrl,
        pricingUrl: service.pricingUrl,
      })
      .from(service)
      .innerJoin(category, eq(service.categoryId, category.id))
      .where(whereExpr)
      .orderBy(asc(service.name))
      .limit(filter.limit);

    const [{ count }] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(service)
      .innerJoin(category, eq(service.categoryId, category.id))
      .where(whereExpr);

    return {
      items: items.map((i) => ({
        sku: i.sku,
        name: i.name,
        icon: i.icon ?? null,
        categorySku: i.categorySku,
        cancelUrl: i.cancelUrl ?? null,
        pricingUrl: i.pricingUrl ?? null,
      })),
      total: count,
    };
  }
}
```

- [ ] **Step 4: `service.service.ts`**

```ts
import type { ServiceListResponse } from '@subzero/shared';

import type { ServiceFilter, ServiceRepository } from './service.types';

const DEFAULT_LIMIT = 20;

export class ServiceService {
  constructor(private readonly repo: ServiceRepository) {}

  async list(filter: Partial<ServiceFilter>): Promise<ServiceListResponse> {
    const f: ServiceFilter = {
      categorySku: filter.categorySku,
      q: filter.q?.trim() || undefined,
      limit: filter.limit ?? DEFAULT_LIMIT,
    };
    return this.repo.listActive(f);
  }
}
```

- [ ] **Step 5: `service.controller.ts`**

```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ServiceListResponse } from '@subzero/shared';

import { ListServicesDto } from './dto/list-services.dto';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(private readonly services: ServiceService) {}

  @Get()
  list(@Query() q: ListServicesDto): Promise<ServiceListResponse> {
    return this.services.list({
      categorySku: q.categorySku,
      q: q.q,
      limit: q.limit,
    });
  }
}
```

- [ ] **Step 6: `service.module.ts`**

```ts
import { Module } from '@nestjs/common';

import { DrizzleServiceRepository } from './service.repository';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  controllers: [ServiceController],
  providers: [
    DrizzleServiceRepository,
    {
      provide: ServiceService,
      useFactory: (repo: DrizzleServiceRepository) => new ServiceService(repo),
      inject: [DrizzleServiceRepository],
    },
  ],
})
export class ServiceModule {}
```

- [ ] **Step 7: Подключить `ServiceModule` в `app.module.ts`**

Добавить `ServiceModule` в `imports`. Импорт сверху файла.

- [ ] **Step 8: Ручная проверка**

Run: `yarn workspace @subzero/api dev`. После логина:
`curl -s -b cookie.txt "http://localhost:3001/api/v1/services?q=netflix"`.
Expected: `{ items: [...], total: ... }` с Netflix первым.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/service apps/api/src/app.module.ts
git commit -m "#83: GET /services — список сервисов с фильтрами"
```

---

## Task 4: Backend — billing-cycle helper

**Files:**
- Create: `apps/api/src/subscription/billing-cycle.ts`
- Create: `apps/api/src/subscription/billing-cycle.spec.ts`

- [ ] **Step 1: Failing tests**

```ts
// apps/api/src/subscription/billing-cycle.spec.ts
import { BillingPeriod } from '@subzero/shared';

import {
  addPeriod,
  computeBackfill,
  countElapsedCycles,
  nextBillingDateAfter,
} from './billing-cycle';

describe('addPeriod', () => {
  it('+1 month', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, 1)).toEqual(
      new Date('2026-02-15T00:00:00Z'),
    );
  });
  it('+12 months across year boundary', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, 12)).toEqual(
      new Date('2027-01-15T00:00:00Z'),
    );
  });
  it('+1 year', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.YEAR, 1)).toEqual(
      new Date('2027-01-15T00:00:00Z'),
    );
  });
});

describe('countElapsedCycles', () => {
  const now = new Date('2026-05-21T00:00:00Z');
  it('0 cycles for future first date', () => {
    expect(
      countElapsedCycles(new Date('2026-06-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(0);
  });
  it('exact past', () => {
    expect(
      countElapsedCycles(new Date('2026-03-21T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(2);
  });
  it('caps at 24 months', () => {
    expect(
      countElapsedCycles(new Date('2020-01-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(24);
  });
  it('caps at 2 years for YEAR period', () => {
    expect(
      countElapsedCycles(new Date('2020-01-01T00:00:00Z'), BillingPeriod.YEAR, now),
    ).toBe(2);
  });
});

describe('nextBillingDateAfter', () => {
  const now = new Date('2026-05-21T00:00:00Z');
  it('future first date — kept as-is', () => {
    expect(
      nextBillingDateAfter(new Date('2026-06-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toEqual(new Date('2026-06-01T00:00:00Z'));
  });
  it('past first date — first slot ≥ now', () => {
    expect(
      nextBillingDateAfter(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toEqual(new Date('2026-06-15T00:00:00Z'));
  });
});

describe('computeBackfill', () => {
  const now = new Date('2026-05-21T00:00:00Z');
  it('emits N period entries with promo split', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-02-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '500.00',
      promoAmount: '0.00',
      promoEndsAt: new Date('2026-04-01T00:00:00Z'),
      now,
    });
    // 3 cycles: Feb-Mar, Mar-Apr (both before promo end), Apr-May (after promo end).
    expect(out).toHaveLength(3);
    expect(out[0].isPromo).toBe(true);
    expect(out[1].isPromo).toBe(true);
    expect(out[2].isPromo).toBe(false);
    expect(out[2].amount).toBe('500.00');
  });
});
```

- [ ] **Step 2: Run — должен упасть с module-not-found**

Run: `yarn workspace @subzero/api test billing-cycle`
Expected: FAIL — cannot find module `./billing-cycle`.

- [ ] **Step 3: Implementation**

```ts
// apps/api/src/subscription/billing-cycle.ts
import { BillingPeriod } from '@subzero/shared';

const MAX_BACKFILL_CYCLES = { [BillingPeriod.MONTH]: 24, [BillingPeriod.YEAR]: 2 } as const;

export function addPeriod(from: Date, period: BillingPeriod, n: number): Date {
  const d = new Date(from.getTime());
  if (period === BillingPeriod.MONTH) {
    d.setUTCMonth(d.getUTCMonth() + n);
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + n);
  }
  return d;
}

export function countElapsedCycles(
  firstBillingDate: Date,
  period: BillingPeriod,
  now: Date,
): number {
  if (firstBillingDate >= now) return 0;
  let n = 0;
  while (addPeriod(firstBillingDate, period, n + 1) <= now) n += 1;
  return Math.min(n, MAX_BACKFILL_CYCLES[period]);
}

export function nextBillingDateAfter(
  firstBillingDate: Date,
  period: BillingPeriod,
  now: Date,
): Date {
  if (firstBillingDate >= now) return firstBillingDate;
  let n = 1;
  while (addPeriod(firstBillingDate, period, n) < now) n += 1;
  return addPeriod(firstBillingDate, period, n);
}

export interface BackfillEntry {
  periodStart: Date;
  periodEnd: Date;
  billedAt: Date;
  amount: string;
  isPromo: boolean;
}

export function computeBackfill(args: {
  firstBillingDate: Date;
  billingPeriod: BillingPeriod;
  amount: string;
  promoAmount: string | null;
  promoEndsAt: Date | null;
  now: Date;
}): BackfillEntry[] {
  const cycles = countElapsedCycles(args.firstBillingDate, args.billingPeriod, args.now);
  const out: BackfillEntry[] = [];
  for (let i = 0; i < cycles; i += 1) {
    const periodStart = addPeriod(args.firstBillingDate, args.billingPeriod, i);
    const periodEnd = addPeriod(args.firstBillingDate, args.billingPeriod, i + 1);
    const inPromo =
      args.promoAmount !== null &&
      args.promoEndsAt !== null &&
      periodEnd <= args.promoEndsAt;
    out.push({
      periodStart,
      periodEnd,
      billedAt: periodEnd,
      amount: inPromo ? (args.promoAmount as string) : args.amount,
      isPromo: inPromo,
    });
  }
  return out;
}
```

- [ ] **Step 4: Run tests — green**

Run: `yarn workspace @subzero/api test billing-cycle`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/subscription/billing-cycle.ts apps/api/src/subscription/billing-cycle.spec.ts
git commit -m "#83: billing-cycle helper (addPeriod, backfill, next)"
```

---

## Task 5: Backend — SubscriptionService (unit, моки репо)

Покрываем доменные правила. Реальный репо ставим в Task 6.

**Files:**
- Create: `apps/api/src/subscription/subscription.types.ts`
- Create: `apps/api/src/subscription/subscription.service.ts`
- Create: `apps/api/src/subscription/subscription.service.spec.ts`

- [ ] **Step 1: `subscription.types.ts`**

```ts
import type {
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
  SubscriptionUpdateDto,
} from '@subzero/shared';

export interface SubscriptionRepository {
  findProjectIdBySku(customerId: string, projectSku: string): Promise<string | null>;
  findServiceByCustomSku(
    sku: string,
  ): Promise<{ id: string; name: string; icon: string | null; categoryId: string } | null>;
  findCategoryIdBySku(sku: string): Promise<string | null>;
  list(
    customerId: string,
    q: SubscriptionListQuery,
  ): Promise<SubscriptionListResponse>;
  findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null>;
  /** INSERT subscription + backfill billing_history в одной транзакции. */
  createWithBackfill(args: {
    customerId: string;
    projectId: string;
    sku: string;
    serviceId: string | null;
    nameCustom: string | null;
    iconCustom: string | null;
    categoryId: string;
    amount: string;
    currencyId: number;
    billingPeriodId: number;
    firstBillingDate: Date;
    nextBillingDate: Date;
    isTrial: boolean;
    promoAmount: string | null;
    promoEndsAt: Date | null;
    comment: string | null;
    backfill: Array<{
      sku: string;
      periodStart: Date;
      periodEnd: Date;
      billedAt: Date;
      amount: string;
      isPromo: boolean;
      currencyId: number;
    }>;
  }): Promise<SubscriptionDto>;
  /** Optimistic update — returns false on version mismatch. */
  update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: Record<string, unknown>;
  }): Promise<boolean>;
  /** Soft-delete (state=ARCHIVED, deleted_at=now). Returns false if не найдена / уже архив. */
  softDelete(customerId: string, sku: string): Promise<boolean>;
}

export interface SubscriptionServiceDeps {
  repo: SubscriptionRepository;
  now: () => Date;
  generateSku: (prefix: 'sub' | 'bil') => string;
}

export type SubscriptionCreateInput = SubscriptionCreateDto;
export type SubscriptionUpdateInput = SubscriptionUpdateDto;
```

- [ ] **Step 2: Failing tests — `subscription.service.spec.ts`**

```ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

import { SubscriptionService } from './subscription.service';
import type {
  SubscriptionCreateInput,
  SubscriptionRepository,
} from './subscription.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const PROJECT_ID = 'p0000000-0000-0000-0000-000000000001';
const CAT_ID = 'cat0000-0000-0000-0000-000000000001';
const SERVICE_ID = 'srv00000-0000-0000-0000-000000000001';

function makeRepo(): jest.Mocked<SubscriptionRepository> {
  return {
    findProjectIdBySku: jest.fn().mockResolvedValue(PROJECT_ID),
    findServiceByCustomSku: jest.fn().mockResolvedValue(null),
    findCategoryIdBySku: jest.fn().mockResolvedValue(CAT_ID),
    list: jest.fn(),
    findBySku: jest.fn(),
    createWithBackfill: jest.fn(),
    update: jest.fn().mockResolvedValue(true),
    softDelete: jest.fn().mockResolvedValue(true),
  };
}

function makeService(now = new Date('2026-05-21T00:00:00Z')) {
  const repo = makeRepo();
  const skuSeq = { sub: 0, bil: 0 };
  const generateSku = (p: 'sub' | 'bil') => `${p}-FAKE${++skuSeq[p]}`;
  const service = new SubscriptionService({ repo, now: () => now, generateSku });
  return { service, repo };
}

function basePayload(over: Partial<SubscriptionCreateInput> = {}): SubscriptionCreateInput {
  return {
    projectSku: 'prj-ABCDEFGH',
    serviceSku: null,
    nameCustom: 'My Subscription',
    iconCustom: null,
    categorySku: 'cat-video',
    amount: '500.00',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '2026-05-01T00:00:00Z',
    isTrial: false,
    promoAmount: null,
    promoEndsAt: null,
    comment: null,
    ...over,
  };
}

describe('SubscriptionService.create — validation', () => {
  it('rejects unknown project (404)', async () => {
    const { service, repo } = makeService();
    repo.findProjectIdBySku.mockResolvedValue(null);
    await expect(service.create(CID, basePayload())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unknown category (404)', async () => {
    const { service, repo } = makeService();
    repo.findCategoryIdBySku.mockResolvedValue(null);
    await expect(service.create(CID, basePayload())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unknown service (404)', async () => {
    const { service, repo } = makeService();
    repo.findServiceByCustomSku.mockResolvedValue(null);
    await expect(
      service.create(CID, basePayload({ serviceSku: 'srv-nope' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects no service and no nameCustom (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ serviceSku: null, nameCustom: null })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects non-positive amount (400)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ amount: '0' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects trial without promoAmount=0 (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(
        CID,
        basePayload({ isTrial: true, promoAmount: '100.00', promoEndsAt: '2026-08-01T00:00:00Z' }),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects promo amount >= amount (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(
        CID,
        basePayload({ promoAmount: '600.00', promoEndsAt: '2026-08-01T00:00:00Z' }),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('SubscriptionService.create — happy path', () => {
  it('passes resolved ids and computed next_billing_date to repo', async () => {
    const { service, repo } = makeService(new Date('2026-05-21T00:00:00Z'));
    repo.createWithBackfill.mockResolvedValue({
      sku: 'sub-FAKE1',
      projectSku: 'prj-ABCDEFGH',
      serviceSku: null,
      name: 'My Subscription',
      icon: null,
      categorySku: 'cat-video',
      categoryCustomSku: null,
      amount: '500.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-05-01T00:00:00.000Z',
      nextBillingDate: '2026-06-01T00:00:00.000Z',
      isTrial: false,
      promoAmount: null,
      promoEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 1,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:00:00.000Z',
    });

    await service.create(CID, basePayload({ firstBillingDate: '2026-05-01T00:00:00Z' }));

    const args = repo.createWithBackfill.mock.calls[0]![0];
    expect(args.projectId).toBe(PROJECT_ID);
    expect(args.categoryId).toBe(CAT_ID);
    expect(args.serviceId).toBeNull();
    expect(args.nameCustom).toBe('My Subscription');
    // firstBillingDate=2026-05-01 < now=2026-05-21 → backfill 1 cycle, next slot = 2026-06-01.
    expect(args.nextBillingDate.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(args.backfill).toHaveLength(1);
    expect(args.backfill[0].sku).toMatch(/^bil-/);
  });
});

describe('SubscriptionService.update', () => {
  it('returns 409 on stale version', async () => {
    const { service, repo } = makeService();
    repo.update.mockResolvedValue(false);
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1',
      projectSku: 'prj-1',
      serviceSku: null,
      name: 'X',
      icon: null,
      categorySku: 'cat-video',
      categoryCustomSku: null,
      amount: '500.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-05-01T00:00:00Z',
      nextBillingDate: '2026-06-01T00:00:00Z',
      isTrial: false,
      promoAmount: null,
      promoEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 5,
      createdAt: '',
      updatedAt: '',
    });
    await expect(
      service.update(CID, 'sub-1', { version: 4, comment: 'updated' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses stateId=ARCHIVED through update (use DELETE)', async () => {
    const { service } = makeService();
    await expect(
      service.update(CID, 'sub-1', { version: 1, stateId: SubscriptionState.ARCHIVED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SubscriptionService.delete', () => {
  it('returns 404 when nothing soft-deleted', async () => {
    const { service, repo } = makeService();
    repo.softDelete.mockResolvedValue(false);
    await expect(service.delete(CID, 'sub-x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 3: Run — expect FAIL (no `subscription.service.ts`)**

Run: `yarn workspace @subzero/api test subscription.service`
Expected: FAIL — module not found.

- [ ] **Step 4: Implementation**

```ts
// apps/api/src/subscription/subscription.service.ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BillingPeriod,
  Currency,
  SubscriptionState,
  type SubscriptionCreateDto,
  type SubscriptionDto,
  type SubscriptionListQuery,
  type SubscriptionListResponse,
  type SubscriptionUpdateDto,
} from '@subzero/shared';

import { computeBackfill, nextBillingDateAfter } from './billing-cycle';
import type {
  SubscriptionRepository,
  SubscriptionServiceDeps,
} from './subscription.types';

const ALLOWED_UPDATE_STATES = new Set<number>([
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
]);

export class SubscriptionService {
  private readonly repo: SubscriptionRepository;
  private readonly now: () => Date;
  private readonly generateSku: (p: 'sub' | 'bil') => string;

  constructor(deps: SubscriptionServiceDeps) {
    this.repo = deps.repo;
    this.now = deps.now;
    this.generateSku = deps.generateSku;
  }

  list(customerId: string, q: SubscriptionListQuery): Promise<SubscriptionListResponse> {
    return this.repo.list(customerId, q);
  }

  async get(customerId: string, sku: string): Promise<SubscriptionDto> {
    const found = await this.repo.findBySku(customerId, sku);
    if (!found) throw new NotFoundException('subscription not found');
    return found;
  }

  async create(customerId: string, dto: SubscriptionCreateDto): Promise<SubscriptionDto> {
    this.validatePromoTrial(dto);
    this.validateAmount(dto.amount);

    const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
    if (!projectId) throw new NotFoundException('project not found');

    const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
    if (!categoryId) throw new NotFoundException('category not found');

    let serviceId: string | null = null;
    if (dto.serviceSku) {
      const svc = await this.repo.findServiceByCustomSku(dto.serviceSku);
      if (!svc) throw new NotFoundException('service not found');
      serviceId = svc.id;
    }

    const nameCustom = (dto.nameCustom ?? '').trim() || null;
    const iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (!serviceId && !nameCustom) {
      throw new UnprocessableEntityException('nameCustom required when serviceSku is empty');
    }

    const firstBillingDate = new Date(dto.firstBillingDate);
    if (Number.isNaN(firstBillingDate.getTime())) {
      throw new BadRequestException('invalid firstBillingDate');
    }
    const now = this.now();
    const promoEndsAt = dto.promoEndsAt ? new Date(dto.promoEndsAt) : null;
    const nextBillingDate = nextBillingDateAfter(firstBillingDate, dto.billingPeriodId, now);

    const backfillEntries = computeBackfill({
      firstBillingDate,
      billingPeriod: dto.billingPeriodId,
      amount: dto.amount,
      promoAmount: dto.promoAmount ?? null,
      promoEndsAt,
      now,
    });

    const backfill = backfillEntries.map((e) => ({
      sku: this.generateSku('bil'),
      periodStart: e.periodStart,
      periodEnd: e.periodEnd,
      billedAt: e.billedAt,
      amount: e.amount,
      isPromo: e.isPromo,
      currencyId: dto.currencyId,
    }));

    return this.repo.createWithBackfill({
      customerId,
      projectId,
      sku: this.generateSku('sub'),
      serviceId,
      nameCustom,
      iconCustom,
      categoryId,
      amount: dto.amount,
      currencyId: dto.currencyId,
      billingPeriodId: dto.billingPeriodId,
      firstBillingDate,
      nextBillingDate,
      isTrial: dto.isTrial,
      promoAmount: dto.promoAmount ?? null,
      promoEndsAt,
      comment: (dto.comment ?? '').trim() || null,
      backfill,
    });
  }

  async update(
    customerId: string,
    sku: string,
    dto: SubscriptionUpdateDto,
  ): Promise<SubscriptionDto> {
    if (dto.stateId !== undefined && !ALLOWED_UPDATE_STATES.has(dto.stateId)) {
      throw new BadRequestException('stateId=ARCHIVED is set via DELETE');
    }
    if (dto.amount !== undefined) this.validateAmount(dto.amount);
    if (dto.promoAmount !== undefined || dto.promoEndsAt !== undefined || dto.isTrial !== undefined) {
      this.validatePromoTrial({
        amount: dto.amount ?? '0.01',
        isTrial: dto.isTrial ?? false,
        promoAmount: dto.promoAmount ?? null,
        promoEndsAt: dto.promoEndsAt ?? null,
      });
    }
    const patch: Record<string, unknown> = {};
    if (dto.nameCustom !== undefined) patch.nameCustom = (dto.nameCustom ?? '').trim() || null;
    if (dto.iconCustom !== undefined) patch.iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currencyId = dto.currencyId;
    if (dto.billingPeriodId !== undefined) patch.billingPeriodId = dto.billingPeriodId;
    if (dto.firstBillingDate !== undefined) patch.firstBillingDate = new Date(dto.firstBillingDate);
    if (dto.isTrial !== undefined) patch.isTrial = dto.isTrial;
    if (dto.promoAmount !== undefined) patch.promoAmount = dto.promoAmount;
    if (dto.promoEndsAt !== undefined) {
      patch.promoEndsAt = dto.promoEndsAt ? new Date(dto.promoEndsAt) : null;
    }
    if (dto.comment !== undefined) patch.comment = (dto.comment ?? '').trim() || null;
    if (dto.stateId !== undefined) patch.stateId = dto.stateId;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    const ok = await this.repo.update({
      customerId,
      sku,
      version: dto.version,
      patch,
    });
    if (!ok) {
      const existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
      throw new ConflictException('version mismatch');
    }
    const after = await this.repo.findBySku(customerId, sku);
    if (!after) throw new NotFoundException('subscription not found');
    return after;
  }

  async delete(customerId: string, sku: string): Promise<void> {
    const ok = await this.repo.softDelete(customerId, sku);
    if (!ok) throw new NotFoundException('subscription not found');
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('amount must be > 0');
  }

  private validatePromoTrial(args: {
    amount: string;
    isTrial: boolean;
    promoAmount: string | null;
    promoEndsAt: string | Date | null;
  }): void {
    const hasPromoAmount = args.promoAmount !== null;
    const hasPromoEnd = args.promoEndsAt !== null;
    if (hasPromoAmount !== hasPromoEnd) {
      throw new UnprocessableEntityException('promoAmount/promoEndsAt must be set together');
    }
    if (args.isTrial) {
      if (!hasPromoAmount || !hasPromoEnd) {
        throw new UnprocessableEntityException('trial requires promoAmount=0 + promoEndsAt');
      }
      if (Number(args.promoAmount) !== 0) {
        throw new UnprocessableEntityException('trial requires promoAmount=0');
      }
    } else if (hasPromoAmount) {
      const p = Number(args.promoAmount);
      const a = Number(args.amount);
      if (!Number.isFinite(p) || p <= 0 || p >= a) {
        throw new UnprocessableEntityException('promoAmount must be > 0 and < amount');
      }
    }
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `yarn workspace @subzero/api test subscription.service`
Expected: все describe-блоки зелёные.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/subscription/subscription.types.ts apps/api/src/subscription/subscription.service.ts apps/api/src/subscription/subscription.service.spec.ts
git commit -m "#83: SubscriptionService — валидация, backfill, optimistic update"
```

---

## Task 6: Backend — SubscriptionRepository (Drizzle)

**Files:**
- Create: `apps/api/src/subscription/subscription.repository.ts`

- [ ] **Step 1: Реализация**

Полный код. Использует drizzle `transaction`. Список — `LEFT JOIN service / category / category_custom`. Soft-delete по `WHERE deleted_at IS NULL`.

```ts
import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  SubscriptionState,
  type SubscriptionDto,
  type SubscriptionListQuery,
  type SubscriptionListResponse,
} from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { billingHistory } from '../db/schema/billing-history';
import { category } from '../db/schema/category';
import { categoryCustom } from '../db/schema/category-custom';
import { project } from '../db/schema/project';
import { service } from '../db/schema/service';
import { subscription } from '../db/schema/subscription';
import type { SubscriptionRepository } from './subscription.types';

const STATE_MAP: Record<string, number[]> = {
  active: [SubscriptionState.ACTIVE],
  paused: [SubscriptionState.PAUSED],
  cancelled: [SubscriptionState.CANCELLED],
  archived: [SubscriptionState.ARCHIVED],
  all: [
    SubscriptionState.ACTIVE,
    SubscriptionState.PAUSED,
    SubscriptionState.CANCELLED,
    SubscriptionState.ARCHIVED,
  ],
};

const DEFAULT_NON_ARCHIVED = [
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
];

function toDto(row: {
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  serviceName: string | null;
  serviceIcon: string | null;
  nameCustom: string | null;
  iconCustom: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  firstBillingDate: Date;
  nextBillingDate: Date;
  isTrial: boolean;
  promoAmount: string | null;
  promoEndsAt: Date | null;
  comment: string | null;
  stateId: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): SubscriptionDto {
  const resolvedName = row.nameCustom ?? row.serviceName ?? '';
  const resolvedIcon = row.iconCustom ?? row.serviceIcon ?? null;
  return {
    sku: row.sku,
    projectSku: row.projectSku,
    serviceSku: row.serviceSku,
    name: resolvedName,
    icon: resolvedIcon,
    categorySku: row.categorySku,
    categoryCustomSku: row.categoryCustomSku,
    amount: row.amount,
    currencyId: row.currencyId,
    billingPeriodId: row.billingPeriodId,
    firstBillingDate: row.firstBillingDate.toISOString(),
    nextBillingDate: row.nextBillingDate.toISOString(),
    isTrial: row.isTrial,
    promoAmount: row.promoAmount,
    promoEndsAt: row.promoEndsAt ? row.promoEndsAt.toISOString() : null,
    comment: row.comment,
    stateId: row.stateId,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findProjectIdBySku(customerId: string, sku: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: project.id })
      .from(project)
      .where(
        and(eq(project.sku, sku), eq(project.customerId, customerId), isNull(project.deletedAt)),
      )
      .limit(1);
    return row?.id ?? null;
  }

  async findServiceByCustomSku(sku: string) {
    const [row] = await this.db
      .select({
        id: service.id,
        name: service.name,
        icon: service.icon,
        categoryId: service.categoryId,
      })
      .from(service)
      .where(and(eq(service.sku, sku), eq(service.isActive, true)))
      .limit(1);
    if (!row) return null;
    return { id: row.id, name: row.name, icon: row.icon, categoryId: row.categoryId };
  }

  async findCategoryIdBySku(sku: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.sku, sku))
      .limit(1);
    return row?.id ?? null;
  }

  async list(
    customerId: string,
    q: SubscriptionListQuery,
  ): Promise<SubscriptionListResponse> {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const where: SQL[] = [eq(subscription.customerId, customerId), isNull(subscription.deletedAt)];
    const states = q.status ? STATE_MAP[q.status] : DEFAULT_NON_ARCHIVED;
    where.push(inArray(subscription.stateId, states));
    if (q.projectSku && q.projectSku !== 'all') {
      where.push(eq(project.sku, q.projectSku));
    }
    if (q.categorySku) {
      where.push(eq(category.sku, q.categorySku));
    }
    if (q.q) {
      const pattern = `%${q.q}%`;
      where.push(
        sql`COALESCE(${subscription.nameCustom}, ${service.name}) ILIKE ${pattern}`,
      );
    }
    const whereExpr = where.length === 1 ? where[0] : and(...where);

    const order =
      q.sort === 'name'
        ? asc(sql`COALESCE(${subscription.nameCustom}, ${service.name})`)
        : q.sort === 'price'
          ? desc(subscription.amount)
          : asc(subscription.nextBillingDate);

    const rows = await this.db
      .select({
        sku: subscription.sku,
        projectSku: project.sku,
        serviceSku: service.sku,
        serviceName: service.name,
        serviceIcon: service.icon,
        nameCustom: subscription.nameCustom,
        iconCustom: subscription.iconCustom,
        categorySku: category.sku,
        categoryCustomSku: categoryCustom.sku,
        amount: subscription.amount,
        currencyId: subscription.currencyId,
        billingPeriodId: subscription.billingPeriodId,
        firstBillingDate: subscription.firstBillingDate,
        nextBillingDate: subscription.nextBillingDate,
        isTrial: subscription.isTrial,
        promoAmount: subscription.promoAmount,
        promoEndsAt: subscription.promoEndsAt,
        comment: subscription.comment,
        stateId: subscription.stateId,
        version: subscription.version,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .from(subscription)
      .innerJoin(project, eq(subscription.projectId, project.id))
      .leftJoin(service, eq(subscription.serviceId, service.id))
      .leftJoin(category, eq(subscription.categoryId, category.id))
      .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
      .where(whereExpr)
      .orderBy(order)
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(subscription)
      .innerJoin(project, eq(subscription.projectId, project.id))
      .leftJoin(service, eq(subscription.serviceId, service.id))
      .leftJoin(category, eq(subscription.categoryId, category.id))
      .where(whereExpr);

    return {
      items: rows.map(toDto),
      total: count,
      page,
      pageSize,
    };
  }

  async findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null> {
    const [row] = await this.db
      .select({
        sku: subscription.sku,
        projectSku: project.sku,
        serviceSku: service.sku,
        serviceName: service.name,
        serviceIcon: service.icon,
        nameCustom: subscription.nameCustom,
        iconCustom: subscription.iconCustom,
        categorySku: category.sku,
        categoryCustomSku: categoryCustom.sku,
        amount: subscription.amount,
        currencyId: subscription.currencyId,
        billingPeriodId: subscription.billingPeriodId,
        firstBillingDate: subscription.firstBillingDate,
        nextBillingDate: subscription.nextBillingDate,
        isTrial: subscription.isTrial,
        promoAmount: subscription.promoAmount,
        promoEndsAt: subscription.promoEndsAt,
        comment: subscription.comment,
        stateId: subscription.stateId,
        version: subscription.version,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .from(subscription)
      .innerJoin(project, eq(subscription.projectId, project.id))
      .leftJoin(service, eq(subscription.serviceId, service.id))
      .leftJoin(category, eq(subscription.categoryId, category.id))
      .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
      .where(
        and(
          eq(subscription.sku, sku),
          eq(subscription.customerId, customerId),
          isNull(subscription.deletedAt),
        ),
      )
      .limit(1);
    return row ? toDto(row) : null;
  }

  async createWithBackfill(args: Parameters<SubscriptionRepository['createWithBackfill']>[0]) {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(subscription)
        .values({
          sku: args.sku,
          customerId: args.customerId,
          projectId: args.projectId,
          serviceId: args.serviceId,
          categoryId: args.categoryId,
          categoryCustomId: null,
          nameCustom: args.nameCustom,
          iconCustom: args.iconCustom,
          amount: args.amount,
          currencyId: args.currencyId,
          billingPeriodId: args.billingPeriodId,
          firstBillingDate: args.firstBillingDate,
          nextBillingDate: args.nextBillingDate,
          isTrial: args.isTrial,
          promoAmount: args.promoAmount,
          promoEndsAt: args.promoEndsAt,
          comment: args.comment,
        })
        .returning({ id: subscription.id });

      if (args.backfill.length > 0) {
        await tx.insert(billingHistory).values(
          args.backfill.map((b) => ({
            sku: b.sku,
            subscriptionId: inserted.id,
            customerId: args.customerId,
            projectId: args.projectId,
            amount: b.amount,
            currencyId: b.currencyId,
            periodStart: b.periodStart,
            periodEnd: b.periodEnd,
            billedAt: b.billedAt,
            isPromo: b.isPromo,
          })),
        );
      }

      const created = await this.findBySkuInTx(tx, args.customerId, args.sku);
      if (!created) throw new Error('subscription disappeared after insert');
      return created;
    });
  }

  // Same query as findBySku but inside the tx — keeps the read consistent.
  private async findBySkuInTx(
    tx: DrizzleDB,
    customerId: string,
    sku: string,
  ): Promise<SubscriptionDto | null> {
    const [row] = await tx
      .select({
        sku: subscription.sku,
        projectSku: project.sku,
        serviceSku: service.sku,
        serviceName: service.name,
        serviceIcon: service.icon,
        nameCustom: subscription.nameCustom,
        iconCustom: subscription.iconCustom,
        categorySku: category.sku,
        categoryCustomSku: categoryCustom.sku,
        amount: subscription.amount,
        currencyId: subscription.currencyId,
        billingPeriodId: subscription.billingPeriodId,
        firstBillingDate: subscription.firstBillingDate,
        nextBillingDate: subscription.nextBillingDate,
        isTrial: subscription.isTrial,
        promoAmount: subscription.promoAmount,
        promoEndsAt: subscription.promoEndsAt,
        comment: subscription.comment,
        stateId: subscription.stateId,
        version: subscription.version,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .from(subscription)
      .innerJoin(project, eq(subscription.projectId, project.id))
      .leftJoin(service, eq(subscription.serviceId, service.id))
      .leftJoin(category, eq(subscription.categoryId, category.id))
      .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
      .where(
        and(
          eq(subscription.sku, sku),
          eq(subscription.customerId, customerId),
          isNull(subscription.deletedAt),
        ),
      )
      .limit(1);
    return row ? toDto(row) : null;
  }

  async update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: Record<string, unknown>;
  }): Promise<boolean> {
    const set: Record<string, unknown> = {
      ...args.patch,
      version: sql`${subscription.version} + 1`,
    };
    const res = await this.db
      .update(subscription)
      .set(set)
      .where(
        and(
          eq(subscription.sku, args.sku),
          eq(subscription.customerId, args.customerId),
          eq(subscription.version, args.version),
          isNull(subscription.deletedAt),
          ne(subscription.stateId, SubscriptionState.ARCHIVED),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }

  async softDelete(customerId: string, sku: string): Promise<boolean> {
    const res = await this.db
      .update(subscription)
      .set({ deletedAt: new Date(), stateId: SubscriptionState.ARCHIVED })
      .where(
        and(
          eq(subscription.sku, sku),
          eq(subscription.customerId, customerId),
          isNull(subscription.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn workspace @subzero/api typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/subscription/subscription.repository.ts
git commit -m "#83: SubscriptionRepository (drizzle + tx backfill)"
```

---

## Task 7: Backend — SubscriptionController + DTO + module

**Files:**
- Create: `apps/api/src/subscription/dto/create-subscription.dto.ts`
- Create: `apps/api/src/subscription/dto/update-subscription.dto.ts`
- Create: `apps/api/src/subscription/dto/list-subscriptions.dto.ts`
- Create: `apps/api/src/subscription/subscription.controller.ts`
- Create: `apps/api/src/subscription/subscription.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: `dto/create-subscription.dto.ts`**

```ts
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BillingPeriod, Currency } from '@subzero/shared';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const CURRENCIES = [Currency.RUB, Currency.USD, Currency.EUR, Currency.BYN];
const PERIODS = [BillingPeriod.MONTH, BillingPeriod.YEAR];

export class CreateSubscriptionDto {
  @IsString()
  @MaxLength(64)
  projectSku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceSku?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nameCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iconCustom?: string | null;

  @IsString()
  @MaxLength(64)
  categorySku!: string;

  @IsString()
  @Matches(AMOUNT_RE, { message: 'amount must be a decimal with ≤2 fractional digits' })
  amount!: string;

  @IsInt()
  @IsIn(CURRENCIES)
  currencyId!: Currency;

  @IsInt()
  @IsIn(PERIODS)
  billingPeriodId!: BillingPeriod;

  @IsISO8601()
  firstBillingDate!: string;

  @IsBoolean()
  isTrial!: boolean;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  promoAmount?: string | null;

  @IsOptional()
  @IsISO8601()
  promoEndsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;
}
```

- [ ] **Step 2: `dto/update-subscription.dto.ts`**

```ts
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const STATES = [
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
];

export class UpdateSubscriptionDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectSku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceSku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iconCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categorySku?: string;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  amount?: string;

  @IsOptional()
  @IsInt()
  @IsIn([Currency.RUB, Currency.USD, Currency.EUR, Currency.BYN])
  currencyId?: Currency;

  @IsOptional()
  @IsInt()
  @IsIn([BillingPeriod.MONTH, BillingPeriod.YEAR])
  billingPeriodId?: BillingPeriod;

  @IsOptional()
  @IsISO8601()
  firstBillingDate?: string;

  @IsOptional()
  @IsBoolean()
  isTrial?: boolean;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  promoAmount?: string | null;

  @IsOptional()
  @IsISO8601()
  promoEndsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;

  @IsOptional()
  @IsInt()
  @IsIn(STATES)
  stateId?: SubscriptionState;
}
```

- [ ] **Step 3: `dto/list-subscriptions.dto.ts`**

```ts
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const STATUSES = ['active', 'paused', 'cancelled', 'archived', 'all'] as const;
const SORTS = ['next', 'name', 'price'] as const;

export class ListSubscriptionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectSku?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categorySku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(SORTS)
  sort?: (typeof SORTS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
```

- [ ] **Step 4: `subscription.controller.ts`**

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  SubscriptionDto,
  SubscriptionListResponse,
} from '@subzero/shared';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionService } from './subscription.service';
import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subs: SubscriptionService) {}

  @Get()
  list(
    @Req() req: Request,
    @Query() q: ListSubscriptionsDto,
  ): Promise<SubscriptionListResponse> {
    return this.subs.list(uid(req), q);
  }

  @Get(':sku')
  get(@Req() req: Request, @Param('sku') sku: string): Promise<SubscriptionDto> {
    return this.subs.get(uid(req), sku);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    return this.subs.create(uid(req), dto);
  }

  @Post(':sku')
  @HttpCode(200)
  update(
    @Req() req: Request,
    @Param('sku') sku: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDto> {
    return this.subs.update(uid(req), sku, dto);
  }

  @Delete(':sku')
  @HttpCode(204)
  async delete(@Req() req: Request, @Param('sku') sku: string): Promise<void> {
    await this.subs.delete(uid(req), sku);
  }
}
```

- [ ] **Step 5: `subscription.module.ts`**

```ts
import { Module } from '@nestjs/common';

import { DrizzleSubscriptionRepository } from './subscription.repository';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { generateSku } from '../shared/sku';

@Module({
  controllers: [SubscriptionController],
  providers: [
    DrizzleSubscriptionRepository,
    {
      provide: SubscriptionService,
      useFactory: (repo: DrizzleSubscriptionRepository) =>
        new SubscriptionService({
          repo,
          now: () => new Date(),
          generateSku: (p) => generateSku(p),
        }),
      inject: [DrizzleSubscriptionRepository],
    },
  ],
})
export class SubscriptionModule {}
```

- [ ] **Step 6: Подключить в `app.module.ts`**

Добавить `SubscriptionModule` в `imports`.

- [ ] **Step 7: Typecheck + dev-smoke**

Run: `yarn workspace @subzero/api typecheck` → PASS.
Run: `yarn workspace @subzero/api dev` и постучаться curl'ом в `POST /api/v1/subscriptions` (auth cookie). Создание возвращает 201 + DTO.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/subscription apps/api/src/app.module.ts
git commit -m "#83: SubscriptionController + DTO + module"
```

---

## Task 8: Backend — e2e тест subscription lifecycle

**Files:**
- Create: `apps/api/src/subscription/subscription.e2e.int.spec.ts`

- [ ] **Step 1: Тест**

```ts
import type { INestApplication } from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';
import request from 'supertest';

import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';

const PFX = '/api/v1';

async function login(http: ReturnType<typeof request>, email: string, password: string) {
  const res = await http.post(`${PFX}/auth/login`).send({ email, password });
  expect(res.status).toBe(200);
  const cookies = res.headers['set-cookie'] as unknown as string[];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

describe('Subscriptions e2e', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let cookies = '';
  let projectSku = '';
  let categorySku = '';

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedCustomer({ email: 'sub@e.com', password: 'Passw0rd1' });
    cookies = await login(http, 'sub@e.com', 'Passw0rd1');
    const projects = await http.get(`${PFX}/projects`).set('Cookie', cookies);
    projectSku = projects.body[0].sku;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', cookies);
    categorySku = cats.body[0].sku;
  });

  it('create → list → get → update → delete → archived list', async () => {
    const created = await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: 'Test Sub',
        amount: '500.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
        isTrial: false,
      });
    expect(created.status).toBe(201);
    const sku = created.body.sku as string;
    expect(sku).toMatch(/^sub-/);

    // Backfill — ровно 1 запись (35 дней назад → 1 цикл).
    const history = await testPool().query(
      'SELECT COUNT(*)::int AS n FROM billing_history WHERE subscription_id = (SELECT id FROM subscription WHERE sku=$1)',
      [sku],
    );
    expect(history.rows[0].n).toBe(1);

    const list = await http.get(`${PFX}/subscriptions`).set('Cookie', cookies);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.total).toBe(1);

    const filtered = await http
      .get(`${PFX}/subscriptions?q=Test`)
      .set('Cookie', cookies);
    expect(filtered.body.items[0].sku).toBe(sku);

    const got = await http.get(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
    expect(got.status).toBe(200);
    expect(got.body.name).toBe('Test Sub');

    const updated = await http
      .post(`${PFX}/subscriptions/${sku}`)
      .set('Cookie', cookies)
      .send({ version: got.body.version, comment: 'note' });
    expect(updated.status).toBe(200);
    expect(updated.body.comment).toBe('note');

    const stale = await http
      .post(`${PFX}/subscriptions/${sku}`)
      .set('Cookie', cookies)
      .send({ version: got.body.version, comment: 'stale' });
    expect(stale.status).toBe(409);

    const removed = await http.delete(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
    expect(removed.status).toBe(204);

    const afterDelete = await http.get(`${PFX}/subscriptions`).set('Cookie', cookies);
    expect(afterDelete.body.items).toHaveLength(0);

    const archived = await http
      .get(`${PFX}/subscriptions?status=archived`)
      .set('Cookie', cookies);
    expect(archived.body.items).toHaveLength(1);
    expect(archived.body.items[0].stateId).toBe(SubscriptionState.ARCHIVED);
  });

  it('hard-deletes subscriptions when project is deleted', async () => {
    await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: 'Will Die',
        amount: '100.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date().toISOString(),
        isTrial: false,
      });

    // Создаём второй проект, чтобы delete первого был разрешён (нельзя удалить последний).
    await http
      .post(`${PFX}/projects`)
      .set('Cookie', cookies)
      .send({ name: 'Second' });

    const del = await http.delete(`${PFX}/projects/${projectSku}`).set('Cookie', cookies);
    expect(del.status).toBe(204);

    const left = await testPool().query(
      'SELECT COUNT(*)::int AS n FROM subscription WHERE project_id IN (SELECT id FROM project WHERE sku=$1)',
      [projectSku],
    );
    expect(left.rows[0].n).toBe(0);
  });
});
```

- [ ] **Step 2: Run — должен пройти**

Run: `yarn workspace @subzero/api test subscription.e2e`
Expected: оба теста зелёные. Если требуется поднять test-DB — действовать как делает `auth.e2e.int.spec.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/subscription/subscription.e2e.int.spec.ts
git commit -m "#83: e2e subscriptions — lifecycle + cascade при delete project"
```

---

## Task 9: Backend — `DELETE /customers/me/subscriptions`

**Files:**
- Modify: `apps/api/src/customer/customer.types.ts`
- Modify: `apps/api/src/customer/customer.repository.ts`
- Modify: `apps/api/src/customer/customer.service.ts`
- Modify: `apps/api/src/customer/customer.service.spec.ts`
- Modify: `apps/api/src/customer/customer.controller.ts`

- [ ] **Step 1: Расширить `CustomerRepository` интерфейс**

В `customer.types.ts` добавить метод:

```ts
export interface CustomerRepository {
  // ... existing methods ...
  /**
   * Hard-delete всех subscription/billing_history customer'а в одной
   * транзакции. Red-zone операция; soft не используем сознательно
   * (см. ctx-business-logic.md §«Удаление»).
   */
  purgeSubscriptions(customerId: string): Promise<void>;
}
```

- [ ] **Step 2: Реализация в `customer.repository.ts`**

```ts
import { billingHistory } from '../db/schema/billing-history';
import { subscription } from '../db/schema/subscription';

// ... внутри DrizzleCustomerProfileRepository ...

async purgeSubscriptions(customerId: string): Promise<void> {
  await this.db.transaction(async (tx) => {
    await tx.delete(billingHistory).where(eq(billingHistory.customerId, customerId));
    await tx.delete(subscription).where(eq(subscription.customerId, customerId));
  });
}
```

- [ ] **Step 3: Метод в `customer.service.ts`**

```ts
async purgeSubscriptions(id: string): Promise<void> {
  await this.require(id);
  await this.repo.purgeSubscriptions(id);
}
```

- [ ] **Step 4: Failing test в `customer.service.spec.ts`**

Добавить новый describe:

```ts
describe('CustomerService.purgeSubscriptions', () => {
  it('делегирует в repo.purgeSubscriptions', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow());
    await service.purgeSubscriptions(ID);
    expect(repo.purgeSubscriptions).toHaveBeenCalledWith(ID);
  });

  it('бросает 401 если customer не найден / архивирован', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(null);
    await expect(service.purgeSubscriptions(ID)).rejects.toThrow();
  });
});
```

В `makeDeps()` добавить в мок repo:

```ts
purgeSubscriptions: jest.fn().mockResolvedValue(undefined),
```

- [ ] **Step 5: Run tests — PASS**

Run: `yarn workspace @subzero/api test customer.service`
Expected: PASS.

- [ ] **Step 6: Ручка в `customer.controller.ts`**

Добавить:

```ts
@Delete('me/subscriptions')
@HttpCode(204)
async purgeSubscriptions(@Req() req: Request): Promise<void> {
  await this.customers.purgeSubscriptions(uid(req));
}
```

- [ ] **Step 7: e2e-проверка вручную (опционально)**

Run: `yarn workspace @subzero/api dev` →
`curl -X DELETE -b cookie.txt http://localhost:3001/api/v1/customers/me/subscriptions`.
Expected: 204; список подписок после этого пустой.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/customer
git commit -m "#83: DELETE /customers/me/subscriptions — bulk red-zone hard-delete"
```

---

## Task 10: Frontend — HTTP client для category / service / subscription

**Files:**
- Create: `apps/web/src/shared/api/category.ts`
- Create: `apps/web/src/shared/api/service.ts`
- Create: `apps/web/src/shared/api/subscription.ts`
- Modify: `apps/web/src/shared/api/customer.ts` (добавить `purgeSubscriptions`)

- [ ] **Step 1: `shared/api/category.ts`**

```ts
import type { CategoryDto } from '@subzero/shared';

import { api } from './client';

export function listCategories(): Promise<CategoryDto[]> {
  return api<CategoryDto[]>('/categories');
}

export type { CategoryDto };
```

- [ ] **Step 2: `shared/api/service.ts`**

```ts
import type { ServiceDto, ServiceListResponse } from '@subzero/shared';

import { api } from './client';

export interface ListServicesParams {
  q?: string;
  categorySku?: string;
  limit?: number;
}

export function listServices(params: ListServicesParams = {}): Promise<ServiceListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.categorySku) sp.set('categorySku', params.categorySku);
  if (params.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return api<ServiceListResponse>(`/services${qs ? `?${qs}` : ''}`);
}

export type { ServiceDto };
```

- [ ] **Step 3: `shared/api/subscription.ts`**

```ts
import type {
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
  SubscriptionUpdateDto,
} from '@subzero/shared';

import { api } from './client';

export function listSubscriptions(q: SubscriptionListQuery = {}): Promise<SubscriptionListResponse> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return api<SubscriptionListResponse>(`/subscriptions${qs ? `?${qs}` : ''}`);
}

export function getSubscription(sku: string): Promise<SubscriptionDto> {
  return api<SubscriptionDto>(`/subscriptions/${sku}`);
}

export function createSubscription(dto: SubscriptionCreateDto): Promise<SubscriptionDto> {
  return api<SubscriptionDto>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateSubscription(
  sku: string,
  dto: SubscriptionUpdateDto,
): Promise<SubscriptionDto> {
  return api<SubscriptionDto>(`/subscriptions/${sku}`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function deleteSubscription(sku: string): Promise<void> {
  return api<void>(`/subscriptions/${sku}`, { method: 'DELETE' });
}

export type { SubscriptionDto, SubscriptionCreateDto, SubscriptionUpdateDto };
```

- [ ] **Step 4: `shared/api/customer.ts` — добавить purge**

В существующий файл (как extra function):

```ts
export function purgeSubscriptions(): Promise<void> {
  return api<void>('/customers/me/subscriptions', { method: 'DELETE' });
}
```

- [ ] **Step 5: Typecheck**

Run: `yarn workspace @subzero/web typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/api
git commit -m "#83: web/shared/api — клиенты categories/services/subscriptions"
```

---

## Task 11: Frontend — entities/category, entities/service, переписать entities/subscription

**Files:**
- Create: `apps/web/src/entities/category/api/list.ts`
- Create: `apps/web/src/entities/category/model/types.ts`
- Create: `apps/web/src/entities/service/api/list.ts`
- Create: `apps/web/src/entities/service/model/types.ts`
- Create: `apps/web/src/entities/subscription/api/{list,get,create,update,remove,purge}.ts`
- Modify: `apps/web/src/entities/subscription/model/types.ts`
- Delete: `apps/web/src/entities/subscription/model/cabinet-mock.ts`
- Modify (или delete): `apps/web/src/entities/subscription/model/cabinet-types.ts`

- [ ] **Step 1: `entities/category/model/types.ts`**

```ts
export type { CategoryDto } from '@subzero/shared';
```

- [ ] **Step 2: `entities/category/api/list.ts`**

```ts
export { listCategories } from '@/shared/api/category';
```

- [ ] **Step 3: `entities/service/model/types.ts`**

```ts
export type { ServiceDto } from '@subzero/shared';
```

- [ ] **Step 4: `entities/service/api/list.ts`**

```ts
export { listServices, type ListServicesParams } from '@/shared/api/service';
```

- [ ] **Step 5: `entities/subscription/api/*`**

Каждый файл — однострочный re-export соответствующей функции из `@/shared/api/subscription` (`list.ts → listSubscriptions`, `get.ts → getSubscription`, `create.ts → createSubscription`, `update.ts → updateSubscription`, `remove.ts → deleteSubscription`).

`purge.ts`:

```ts
export { purgeSubscriptions } from '@/shared/api/customer';
```

- [ ] **Step 6: Переписать `entities/subscription/model/types.ts`**

```ts
import type { SubscriptionDto } from '@subzero/shared';

export type { SubscriptionDto };

/** UI-форматированная подписка для существующих компонентов кабинета. */
export interface CabinetSubscription {
  sku: string;
  name: string;
  icon: string | null;
  projectSku: string;
  categorySku: string | null;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  nextBillingDate: string;
  isTrial: boolean;
  promoEndsAt: string | null;
  stateId: number;
  comment: string | null;
  version: number;
}

export function toCabinetSubscription(dto: SubscriptionDto): CabinetSubscription {
  return {
    sku: dto.sku,
    name: dto.name,
    icon: dto.icon,
    projectSku: dto.projectSku,
    categorySku: dto.categorySku,
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    nextBillingDate: dto.nextBillingDate,
    isTrial: dto.isTrial,
    promoEndsAt: dto.promoEndsAt,
    stateId: dto.stateId,
    comment: dto.comment,
    version: dto.version,
  };
}
```

- [ ] **Step 7: Удалить мок**

```bash
git rm apps/web/src/entities/subscription/model/cabinet-mock.ts
git rm apps/web/src/entities/subscription/model/cabinet-types.ts
```

(`cabinet-types.ts` уходит — типы переехали в `types.ts`. Если на момент удаления его всё ещё кто-то импортирует — почистить эти импорты).

- [ ] **Step 8: Typecheck**

Run: `yarn workspace @subzero/web typecheck`
Expected: будут ошибки на потреблении удалённого мока в `_pages/subscriptions/ui/*` и `features/subscription-form/*` — это нормально, чистим в Tasks 12-14.

- [ ] **Step 9: Commit (WIP)**

```bash
git add apps/web/src/entities
git commit -m "#83: entities subscription/service/category — реальные API типы; удалил mock"
```

---

## Task 12: Frontend — SubsListView на API + URL-state + серверная пагинация

**Files:**
- Modify: `apps/web/src/_pages/subscriptions/ui/SubsListView.tsx`
- Modify: `apps/web/src/_pages/subscriptions/ui/SubscriptionsPage.tsx`

Стратегия: переписать `SubsListView` так, чтобы он сам ходил в API через `listSubscriptions(q)` при каждом изменении URL-параметров. Локального состояния списка нет — только локальный debounce поискового поля.

- [ ] **Step 1: Заменить body `SubsListView` целиком**

Базовая структура:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  SubscriptionListResponse,
  SubscriptionListSort,
  SubscriptionListStatus,
} from '@subzero/shared';
import { listSubscriptions } from '@/entities/subscription/api/list';
import { toCabinetSubscription, type CabinetSubscription } from '@/entities/subscription/model/types';
import { useCabinet } from '@/shared/contexts/cabinet-context';
// ... остальные импорты как было

const PAGE_SIZE = 20;

interface Props {
  onEdit: (sub: CabinetSubscription) => void;
}

export function SubsListView({ onEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { project } = useCabinet();

  const status = (searchParams.get('status') as SubscriptionListStatus | null) ?? 'all';
  const sort = (searchParams.get('sort') as SubscriptionListSort | null) ?? 'next';
  const cat = searchParams.get('cat') ?? 'all';
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const [searchInput, setSearchInput] = useState(q);
  const [data, setData] = useState<SubscriptionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce поискового инпута → URL.
  useEffect(() => {
    if (searchInput === q) return;
    const id = setTimeout(() => updateUrl({ q: searchInput, page: 1 }), 300);
    return () => clearTimeout(id);
  }, [searchInput, q]);

  // Фетч при изменении URL-параметров.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    listSubscriptions({
      projectSku: project === 'all' ? 'all' : project,
      status,
      categorySku: cat === 'all' ? undefined : cat,
      q: q || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => alive && (setData(res), setError(null)))
      .catch(() => alive && setError('Не удалось загрузить'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [project, status, cat, q, sort, page]);

  function updateUrl(patch: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 'all') sp.delete(k);
      else sp.set(k, String(v));
    }
    const qs = sp.toString();
    router.replace(`/account/subscriptions${qs ? `?${qs}` : ''}`);
  }

  const rows = useMemo(
    () => (data?.items ?? []).map(toCabinetSubscription),
    [data],
  );

  // ... ниже использовать `rows`, `data.total`, `data.page` вместо локального clientside slice.
  // CTA, поиск, фильтры — те же UI-блоки, но onChange зовут updateUrl(...).
  // Loading: показывать 3-4 строки-скелетона. Error: баннер. Empty: «Подписок пока нет — добавьте первую».
  return /* ... вёрстка как раньше, но с биндингом на URL + skeleton/empty */;
}
```

Конкретный JSX в самом файле — переиспользовать существующую разметку из текущего файла, заменив `useState`/`useMemo` на URL-state и серверные `rows`. Pagination-блок — биндить кнопки на `updateUrl({ page })`, total страниц = `Math.ceil(data.total / pageSize)`.

- [ ] **Step 2: `SubscriptionsPage.tsx` — переключить `editing` со стейта на API-получение по sku**

Заменить локальное `editing` на:

```tsx
const [editSku, setEditSku] = useState<string | null>(null);
const [editing, setEditing] = useState<SubscriptionDto | null>(null);

useEffect(() => {
  if (!editSku) { setEditing(null); return; }
  let alive = true;
  getSubscription(editSku).then((s) => alive && setEditing(s)).catch(() => {});
  return () => { alive = false; };
}, [editSku]);
```

`onEdit` в `SubsListView` теперь принимает `sku` (или `CabinetSubscription`, у которого есть `sku`) — устанавливаем `setEditSku(sub.sku)`.

- [ ] **Step 3: Verify в браузере**

Run: `yarn workspace @subzero/web dev`. Зайти в `/account/subscriptions`, проверить:
1. URL обновляется при смене фильтров / страниц / сортировки.
2. Search debounce работает (≤300мс).
3. Skeleton при первом заходе.
4. Empty state когда подписок 0.

Скриншоты не сохраняем, описать руками в commit message при необходимости.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/_pages/subscriptions
git commit -m "#83: subscriptions list — серверная пагинация + URL-state"
```

---

## Task 13: Frontend — SubscriptionForm на API

**Files:**
- Modify: `apps/web/src/features/subscription-form/ui/SubscriptionForm.tsx`
- Modify: `apps/web/src/features/subscription-form/ui/ServicePickerInline.tsx`
- Modify: `apps/web/src/features/subscription-form/types.ts`

- [ ] **Step 1: Подкачать список категорий + сервисов из API**

В `SubscriptionForm`:

```tsx
const [categories, setCategories] = useState<CategoryDto[]>([]);
useEffect(() => { listCategories().then(setCategories).catch(() => {}); }, []);
```

В `ServicePickerInline` — на каждый ввод вызывать `listServices({ q, categorySku, limit: 20 })` (debounce 200мс), отдавать `{ items }` потребителю.

- [ ] **Step 2: Submit → API**

В `SubscriptionForm.onSubmit`:

```tsx
async function submit() {
  const payload: SubscriptionCreateDto = {
    projectSku: form.projectSku,
    serviceSku: form.serviceSku ?? null,
    nameCustom: form.serviceSku ? null : form.name,
    iconCustom: form.iconCustom ?? null,
    categorySku: form.categorySku,
    amount: form.amount,
    currencyId: form.currencyId,
    billingPeriodId: form.billingPeriodId,
    firstBillingDate: form.firstBillingDate,
    isTrial: form.isTrial,
    promoAmount: form.promoAmount ?? null,
    promoEndsAt: form.promoEndsAt ?? null,
    comment: form.comment ?? null,
  };
  try {
    if (initial?.sku) {
      await updateSubscription(initial.sku, { version: initial.version, ...payload });
    } else {
      await createSubscription(payload);
    }
    onClose();
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      setBanner('Подписка изменена в другой вкладке — обновите страницу');
    } else if (err instanceof ApiError && err.status === 422) {
      setBanner('Проверьте поля цены и промо');
    } else {
      setBanner('Не удалось сохранить');
    }
  }
}
```

- [ ] **Step 3: Обновить `types.ts`**

Заменить `SubscriptionFormInitial` поля на DTO-совместимые (см. план Task 1):

```ts
import type { SubscriptionDto } from '@subzero/shared';

export interface SubscriptionFormInitial {
  sku?: string;
  version?: number;
  projectSku: string;
  serviceSku: string | null;
  name: string;
  iconCustom?: string | null;
  categorySku: string;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  firstBillingDate: string;
  isTrial: boolean;
  promoAmount?: string | null;
  promoEndsAt?: string | null;
  comment?: string | null;
}

export function fromDto(dto: SubscriptionDto): SubscriptionFormInitial {
  return {
    sku: dto.sku,
    version: dto.version,
    projectSku: dto.projectSku,
    serviceSku: dto.serviceSku,
    name: dto.name,
    iconCustom: dto.icon,
    categorySku: dto.categorySku ?? '',
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    firstBillingDate: dto.firstBillingDate,
    isTrial: dto.isTrial,
    promoAmount: dto.promoAmount,
    promoEndsAt: dto.promoEndsAt,
    comment: dto.comment,
  };
}
```

В `SubscriptionsPage` подставлять `fromDto(editing)` в `initial`, в режиме «new» — собирать минимум:

```ts
const newInitial: SubscriptionFormInitial = {
  projectSku: project === 'all' ? defaultProjectSku : project,
  serviceSku: null,
  name: '',
  categorySku: '',
  amount: '',
  currencyId: Currency.RUB,
  billingPeriodId: BillingPeriod.MONTH,
  firstBillingDate: new Date().toISOString(),
  isTrial: false,
};
```

`defaultProjectSku` — берётся из `useProjects().projects[0]?.sku` (есть в shared/contexts).

- [ ] **Step 4: Verify в браузере**

Запустить web+api, создать подписку с прошлой датой; затем отредактировать; проверить, что 409 при второй вкладке корректно показывает баннер.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/subscription-form
git commit -m "#83: SubscriptionForm — реальные сервисы/категории + create/update"
```

---

## Task 14: Frontend — delete single subscription (внутри формы)

**Files:**
- Create: `apps/web/src/features/delete-subscription/ui/DeleteSubscriptionButton.tsx`
- Modify: `apps/web/src/features/subscription-form/ui/SubscriptionForm.tsx`

- [ ] **Step 1: Кнопка с подтверждением**

```tsx
'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useLang } from '@/shared/contexts/lang-context';
import { deleteSubscription } from '@/entities/subscription/api/remove';

interface Props {
  sku: string;
  name: string;
  onDeleted: () => void;
}

export function DeleteSubscriptionButton({ sku, name, onDeleted }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await deleteSubscription(sku);
      onDeleted();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} type="button" style={{ /* danger-style */ }}>
        {t('Удалить подписку', 'Delete subscription')}
      </button>
      {open && (
        <ConfirmDialog
          title={t('Удалить подписку', 'Delete subscription')}
          body={t(`«${name}» уйдёт в архив.`, `«${name}» will be archived.`)}
          confirmLabel={t('Удалить', 'Delete')}
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
          danger
          loading={loading}
        />
      )}
    </>
  );
}
```

(Если `ConfirmDialog` ожидает другой API — посмотреть `projects` страницу и подстроить пропсы под ту реализацию.)

- [ ] **Step 2: Вмонтировать в `SubscriptionForm`**

В режиме edit (когда `initial?.sku`), внизу формы рядом с «Сохранить»:

```tsx
{initial?.sku && (
  <DeleteSubscriptionButton sku={initial.sku} name={initial.name} onDeleted={onClose} />
)}
```

- [ ] **Step 3: Verify в браузере**

Удалить подписку из формы редактирования, убедиться что она пропала из «активных» и появилась в «архиве» (фильтр status=archived).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/delete-subscription apps/web/src/features/subscription-form
git commit -m "#83: delete-subscription — кнопка в форме редактирования"
```

---

## Task 15: Frontend — bulk red-zone «Удалить все подписки»

**Files:**
- Create: `apps/web/src/features/delete-all-subscriptions/ui/DeleteAllSubscriptionsAction.tsx`
- Modify: `apps/web/src/_pages/settings/ui/SettingsAccount.tsx`

- [ ] **Step 1: Компонент**

```tsx
'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useLang } from '@/shared/contexts/lang-context';
import { purgeSubscriptions } from '@/shared/api/customer';
import { ApiError } from '@/shared/api/client';

interface Props {
  buttonStyle: React.CSSProperties;
}

export function DeleteAllSubscriptionsAction({ buttonStyle }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await purgeSubscriptions();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? `API error ${err.status}` : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={buttonStyle} type="button">
        {done
          ? t('Удалено', 'Deleted')
          : t('Удалить подписки', 'Delete subscriptions')}
      </button>
      {open && (
        <ConfirmDialog
          title={t('Удалить все подписки?', 'Delete all subscriptions?')}
          body={t(
            'Удалит подписки и историю списаний во всех проектах. Действие необратимо.',
            'Removes all subscriptions and billing history across all projects. Irreversible.',
          )}
          confirmLabel={t('Удалить', 'Delete')}
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
          danger
          loading={loading}
          error={error}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Подключить в `SettingsAccount.tsx`**

В блоке Danger zone заменить статичный `<button style={sBtnDanger}>` на:

```tsx
<DeleteAllSubscriptionsAction buttonStyle={sBtnDanger} />
```

- [ ] **Step 3: Verify в браузере**

Создать пару подписок → /account/settings → Danger zone → Удалить подписки → подтвердить. После операции `/account/subscriptions` показывает empty state.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/delete-all-subscriptions apps/web/src/_pages/settings
git commit -m "#83: red-zone «Удалить подписки» — hard purge через DELETE /customers/me/subscriptions"
```

---

## Task 16: Smoke + typecheck + final clean-up

**Files:**
- Modify: любой файл с импортами удалённого `cabinet-mock` (если остался)

- [ ] **Step 1: Typecheck оба воркспейса**

Run: `yarn typecheck` (или `yarn workspace @subzero/api typecheck && yarn workspace @subzero/web typecheck`)
Expected: PASS без warnings.

- [ ] **Step 2: Lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 3: Все тесты**

Run: `yarn workspace @subzero/api test`
Expected: PASS (включая `subscription.service`, `billing-cycle`, `subscription.e2e`, `customer.service`).

- [ ] **Step 4: Verify в браузере golden path**

Run: `yarn dev` (или независимо api + web).
1. Логин → /account/subscriptions.
2. Создать подписку с датой первого списания 35 дней назад → создаётся, в архиве истории появилась 1 запись (`SELECT COUNT(*) FROM billing_history`).
3. Изменить комментарий → 200, в списке обновился.
4. Поиск, фильтры, пагинация — каждый изменяет URL, рендерит правильные данные.
5. Удалить подписку из формы → пропала.
6. /account/settings → Danger zone → удалить подписки → все ушли.
7. /account/projects → создать второй проект → удалить первый → подписки удалены вместе с ним.

- [ ] **Step 5: Финальный коммит (если что-то добавилось)**

```bash
git status
# Если есть изменения — git add + commit "#83: финальные правки subscriptions"
```

---

## Self-Review

**Spec coverage:**
- §3.1 CategoryModule — Task 2 ✅
- §3.2 ServiceModule — Task 3 ✅
- §3.3 SubscriptionModule (DTO, эндпоинты, доменные правила, backfill, optimistic lock) — Tasks 1, 4, 5, 6, 7, 8 ✅
- §3.4 `DELETE /customers/me/subscriptions` — Task 9 ✅
- §3.5 Project без правок — подтверждено e2e в Task 8 ✅
- §3.6 миграций нет — подтверждено ✅
- §3.7 тесты — Tasks 4, 5, 8, 9 ✅
- §4 FSD — Tasks 10, 11, 12, 13, 14, 15 ✅
- §5 архитектурные ограничения — отражены в Tasks 6/9 (транзакции) ✅
- §6 безопасность — JWT-guard стоит на всех эндпоинтах; ownership через JWT ✅

**Placeholder scan:** В плане плейсхолдер только `#83` для номера issue (заполнится при старте). Никаких «TBD», «implement later», «similar to Task N» в коде шагов нет — все блоки самодостаточные.

**Type consistency:** `SubscriptionDto`, `SubscriptionCreateDto`, `SubscriptionUpdateDto`, `SubscriptionListQuery` определены в Task 1 и используются единообразно в Tasks 5-13. `purgeSubscriptions` назван одинаково на бэке (`CustomerService.purgeSubscriptions`, Task 9), фронт-клиенте (`shared/api/customer.ts`, Task 10) и UI (`DeleteAllSubscriptionsAction`, Task 15). Параметры URL-state (`status`, `cat`, `sort`, `q`, `page`) совпадают со `SubscriptionListQuery`.

Никаких функций/типов, упомянутых только декларативно — не нашёл.
