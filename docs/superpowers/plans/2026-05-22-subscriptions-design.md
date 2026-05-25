# Subscriptions Design v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести страницу подписок и форму к новому дизайну (Sub0 Cabinet) + поправить ключевые дефекты: hard-delete отдельной подписки, multi-promo, независимость trial / promo, кастомный DatePicker, подсветка «сегодня».

**Architecture:** Бэкенд получает новую таблицу `subscription_promo` (multi-promo) + колонку `trial_ends_at`, разводит trial и promo по разным инвариантам, переключает индивидуальный delete на hard. Фронт получает кастомный `DatePicker`, переписанную форму с секциями 01/02/03 и live-summary, multi-promo UI, подсветку «сегодняшних» подписок и view-time recompute `nextBillingDate` (без cron).

**Tech Stack:** NestJS 10 + Drizzle + Postgres (миграции, repo, service). Next.js 15 + FSD (DatePicker, форма, список). Дизайн-источник: `/tmp/sub0-design/sub0/project/{cabinet-subs.jsx, cabinet-common.jsx, Sub0 Cabinet.html}`.

---

## Context

Базируется на ветке `subscriptions` (PR #84 — ожидает merge). Если #84 уже в master — branch'имся от master. Иначе — продолжаем стэк от `subscriptions`. Issue: создаётся при старте работы, плэйсхолдер в коммитах `#85`.

Замыкает #44 (multi-promo).
Соприкасается с #43 (subscription color) — не трогаем.

---

## File Structure

### Backend (`apps/api`)

Новые миграции:
- `drizzle/0017_create_subscription_promo.sql`
- `drizzle/0018_add_subscription_trial_ends_at.sql`
- `drizzle/0019_backfill_subscription_promo.sql`

Drizzle schemas:
- Create: `src/db/schema/subscription-promo.ts`
- Modify: `src/db/schema/subscription.ts` (добавить `trialEndsAt`)
- Modify: `src/db/schema/index.ts` (re-export)

Repo/service/controller:
- Create: `src/subscription/subscription-promo.types.ts`
- Create: `src/subscription/subscription-promo.repository.ts`
- Modify: `src/subscription/subscription.types.ts` (новые методы repo: `hardDelete`, promo CRUD)
- Modify: `src/subscription/subscription.repository.ts` (`hardDelete` + select promos в DTO + write promos в `createWithBackfill`)
- Modify: `src/subscription/subscription.service.ts` (trial независим, promos массив, hard delete)
- Modify: `src/subscription/subscription.service.spec.ts` (новые тесты)
- Modify: `src/subscription/subscription.e2e.int.spec.ts` (hard-delete + multi-promo)
- Modify: `src/subscription/subscription.module.ts` (provide promo repo)
- Modify: `src/subscription/subscription.controller.ts` — без изменений (DTO выдаст архив-фильтр; см. ниже)
- Modify: `src/subscription/dto/create-subscription.dto.ts` (`promos: NewPromoDto[]` + `trialEndsAt`)
- Modify: `src/subscription/dto/update-subscription.dto.ts` (то же + `version` для promo)
- Modify: `src/subscription/dto/list-subscriptions.dto.ts` (убрать `'archived'` из STATUSES)

Shared:
- Modify: `packages/shared/src/dto/subscription.ts` (типы Promo, поля trialEndsAt; убрать promo_amount/promo_ends_at)

### Frontend (`apps/web`)

- Create: `src/shared/components/ui/SubDatePicker.tsx` (кастомный пикер по дизайну)
- Modify: `src/_pages/subscriptions/ui/SubsListView.tsx` (today highlight, «Сегодня» label, display-next compute, убрать архив-фильтр)
- Modify: `src/features/subscription-form/types.ts` (state.promos: PromoState[], trialEndsAt; убрать promoAmount/promoEndsAt)
- Modify: `src/features/subscription-form/ui/SubscriptionForm.tsx` (секции 01/02/03, live summary, multi-promo, suggested next, custom date pickers)
- Modify: `src/features/delete-subscription/ui/DeleteSubscriptionButton.tsx` (формулировка: «удалить безвозвратно»)
- Create: `src/shared/lib/date.ts` (helpers: `todayISO`, `startOfTodayInTZ`, `displayNextBillingDate`)

### Shared lib

- Create: `apps/api/src/subscription/promo-resolver.ts` (resolver текущей цены по массиву промо; pure, тестируемый)

### Docs

- Modify: `ai/ctx-business-logic.md` — §«Subscription — promo / trial» переписать; §«Удаление» — subscription hard.
- Modify: `ai/ctx-architecture.md` — добавить `subscription_promo` в карту + правило про префикс `spm`.

---

## Conventions reminder

- Yarn 1.x workspaces.
- HTTP: GET/POST/DELETE only — никаких PATCH/PUT.
- Все доменные таблицы: `sku` + `version` + `deleted_at` + timestamps. Partial index `WHERE deleted_at IS NULL`.
- SKU prefixes: добавляем `spm` для `subscription_promo`.
- 1 миграция — 1 правка (см. ctx-architecture).
- Commit: `#85: <subject>` + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- Не пушить master, не править remote.
- Сохранять dirty-check / 2-сек «Сохранено» флэш как в проектах.

---

## Task 1: SKU helper — добавить префикс `spm`

**Files:**
- Modify: `apps/api/src/shared/sku.ts`
- Test: `apps/api/src/shared/sku.spec.ts`

- [ ] **Step 1: Расширить failing test**

Добавить в `sku.spec.ts` (после существующих кейсов):

```ts
it('генерит spm-префикс корректно', () => {
  const v = generateSku('spm');
  expect(v).toMatch(/^spm-[0-9A-HJ-NP-TV-Z]{8}$/);
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `yarn workspace @subzero/api test sku.spec`
Expected: FAIL — TS не принимает `'spm'` в union.

- [ ] **Step 3: Расширить тип**

В `apps/api/src/shared/sku.ts`:

```ts
export function generateSku(prefix: 'cus' | 'prj' | 'sub' | 'bil' | 'cct' | 'spm'): string {
  return `${prefix}-${randomBody()}`;
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `yarn workspace @subzero/api test sku.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/shared/sku.ts apps/api/src/shared/sku.spec.ts
git commit -m "$(cat <<'EOF'
#85: sku — добавил префикс spm для subscription_promo

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Drizzle schema — `subscription-promo.ts`

**Files:**
- Create: `apps/api/src/db/schema/subscription-promo.ts`
- Modify: `apps/api/src/db/schema/index.ts`

- [ ] **Step 1: `subscription-promo.ts`**

```ts
import { sql } from 'drizzle-orm';
import { index, integer, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { subscription } from './subscription';

export const subscriptionPromo = pgTable(
  'subscription_promo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscription.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('subscription_promo_sku_key').on(t.sku),
    index('idx_subscription_promo_sub_active')
      .on(t.subscriptionId, t.endsAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type SubscriptionPromo = typeof subscriptionPromo.$inferSelect;
export type NewSubscriptionPromo = typeof subscriptionPromo.$inferInsert;
```

- [ ] **Step 2: re-export в `index.ts`**

В `apps/api/src/db/schema/index.ts` добавить строку:

```ts
export * from './subscription-promo';
```

Не трогать другие строки.

- [ ] **Step 3: Modify `subscription.ts` — добавить `trial_ends_at`**

В `apps/api/src/db/schema/subscription.ts` ниже строки `isTrial: ...` добавить:

```ts
trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
```

- [ ] **Step 4: Typecheck**

Run: `yarn workspace @subzero/api typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema/subscription-promo.ts apps/api/src/db/schema/subscription.ts apps/api/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
#85: schema — subscription_promo + subscription.trial_ends_at

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Миграция 0017 — create `subscription_promo`

**Files:**
- Create: `apps/api/drizzle/0017_create_subscription_promo.sql`
- Modify: `apps/api/drizzle/meta/_journal.json` (drizzle-kit обновит автоматически)
- Modify: `apps/api/drizzle/meta/0017_snapshot.json` (drizzle-kit обновит автоматически)

- [ ] **Step 1: Сгенерировать миграцию через drizzle-kit**

Run: `yarn workspace @subzero/api drizzle:generate`
Expected: создаются файлы `0017_*.sql` и обновляется journal/snapshot.

- [ ] **Step 2: Проверить содержимое**

Открыть сгенерированный `0017_*.sql`. Содержит ТОЛЬКО `CREATE TABLE subscription_promo` + индексы — НЕ должен трогать `subscription` (та миграция отдельно — Task 4).

Если drizzle-kit сгенерировал в одну миграцию и create_table и alter subscription — разбить на две файла вручную:
- `0017_create_subscription_promo.sql` — только CREATE TABLE
- `0018_add_subscription_trial_ends_at.sql` — только ALTER TABLE subscription ADD COLUMN trial_ends_at

Обновить `_journal.json` под обе записи.

- [ ] **Step 3: Применить миграцию к локальной dev-БД**

Run: `yarn workspace @subzero/api drizzle:migrate`
Expected: успех. Если падает — посмотреть ошибку в БД.

- [ ] **Step 4: Commit**

```bash
git add apps/api/drizzle/0017_create_subscription_promo.sql apps/api/drizzle/0018_add_subscription_trial_ends_at.sql apps/api/drizzle/meta
git commit -m "$(cat <<'EOF'
#85: миграция — subscription_promo + subscription.trial_ends_at

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Миграция 0019 — backfill `subscription_promo` из старых полей

**Files:**
- Create: `apps/api/drizzle/0019_backfill_subscription_promo.sql`

- [ ] **Step 1: Написать миграцию вручную**

Drizzle-kit не делает data migrations — пишем сами:

```sql
-- Перенос существующих одиночных промо в subscription_promo.
-- Старые колонки promo_amount/promo_ends_at пока остаются (expand) —
-- drop отдельной миграцией в следующем релизе.
INSERT INTO subscription_promo (sku, subscription_id, amount, ends_at)
SELECT
  'spm-' || substr(md5(random()::text || s.id::text), 1, 8),
  s.id,
  s.promo_amount,
  s.promo_ends_at
FROM subscription s
WHERE s.promo_amount IS NOT NULL
  AND s.promo_ends_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscription_promo p
    WHERE p.subscription_id = s.id AND p.deleted_at IS NULL
  );
```

(SKU здесь генерится псевдослучайно через `md5` — это backfill, на коллизию падать не будем; если что — повтор миграции уберёт дубли через `NOT EXISTS`.)

- [ ] **Step 2: Дописать в `_journal.json`**

Добавить запись:

```json
{
  "idx": 19,
  "version": "7",
  "when": <timestamp_ms>,
  "tag": "0019_backfill_subscription_promo",
  "breakpoints": true
}
```

- [ ] **Step 3: Применить**

Run: `yarn workspace @subzero/api drizzle:migrate`
Expected: успех. Если в dev-БД нет старых данных — миграция no-op.

- [ ] **Step 4: Commit**

```bash
git add apps/api/drizzle/0019_backfill_subscription_promo.sql apps/api/drizzle/meta/_journal.json
git commit -m "$(cat <<'EOF'
#85: миграция — backfill subscription_promo из promo_amount/promo_ends_at

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Shared DTO — Promo + trialEndsAt

**Files:**
- Modify: `packages/shared/src/dto/subscription.ts`

- [ ] **Step 1: Полностью переписать содержимое файла**

```ts
import type { BillingPeriod, Currency, SubscriptionState } from '../enums';

/** Active promo: `endsAt > now()` AND deleted_at IS NULL. */
export interface PromoDto {
  sku: string;
  amount: string;
  endsAt: string;
  version: number;
}

/** Promo input on create/update — no sku, server generates. */
export interface NewPromoDto {
  amount: string;
  endsAt: string;
}

/** Promo update — references existing by sku, requires version. */
export interface UpdatePromoDto {
  sku: string;
  version: number;
  amount?: string;
  endsAt?: string;
}

export interface SubscriptionDto {
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  name: string;
  icon: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  nextBillingDate: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  comment: string | null;
  stateId: SubscriptionState;
  version: number;
  createdAt: string;
  updatedAt: string;
  promos: PromoDto[];
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
  trialEndsAt?: string | null;
  comment?: string | null;
  promos?: NewPromoDto[];
}

export type SubscriptionUpdateDto = Partial<Omit<SubscriptionCreateDto, 'promos'>> & {
  version: number;
  stateId?: SubscriptionState;
  /** Replace-all семантика: что прислали — то и есть. Сервер удалит то, чего нет. */
  promos?: Array<NewPromoDto | UpdatePromoDto>;
};

/** Status filter — archive NO LONGER offered; ARCHIVED только через cascade customer-delete. */
export type SubscriptionListStatus = 'active' | 'paused' | 'cancelled' | 'all';

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

- [ ] **Step 2: Build shared**

Run: `yarn workspace @subzero/shared build`
Expected: PASS.

- [ ] **Step 3: Typecheck сразу повалится в потребителях**

Это ожидаемо — Tasks 6-13 их починят. Но проверь что сама `packages/shared` собралась.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/dto/subscription.ts
git commit -m "$(cat <<'EOF'
#85: shared DTO — promos массив, trialEndsAt, статус без archived

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Pure promo resolver

**Files:**
- Create: `apps/api/src/subscription/promo-resolver.ts`
- Create: `apps/api/src/subscription/promo-resolver.spec.ts`

- [ ] **Step 1: Failing tests**

```ts
// apps/api/src/subscription/promo-resolver.spec.ts
import { resolveCurrentPrice, type PromoLike } from './promo-resolver';

const now = new Date('2026-05-22T12:00:00Z');
const future = (days: number) => new Date(now.getTime() + days * 86400 * 1000);
const past = (days: number) => new Date(now.getTime() - days * 86400 * 1000);

describe('resolveCurrentPrice', () => {
  it('возвращает amount подписки при пустом списке promo', () => {
    expect(resolveCurrentPrice('500.00', [], now)).toEqual({ amount: '500.00', isPromo: false });
  });

  it('игнорирует промо с прошедшим ends_at', () => {
    const promos: PromoLike[] = [{ amount: '100.00', endsAt: past(1) }];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '500.00', isPromo: false });
  });

  it('выбирает активный промо', () => {
    const promos: PromoLike[] = [{ amount: '100.00', endsAt: future(5) }];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '100.00', isPromo: true });
  });

  it('из нескольких активных выбирает минимальный amount', () => {
    const promos: PromoLike[] = [
      { amount: '200.00', endsAt: future(10) },
      { amount: '50.00',  endsAt: future(5) },
      { amount: '150.00', endsAt: future(20) },
    ];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '50.00', isPromo: true });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `yarn workspace @subzero/api test promo-resolver`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementation**

```ts
// apps/api/src/subscription/promo-resolver.ts
export interface PromoLike {
  amount: string;
  endsAt: Date;
}

export interface ResolvedPrice {
  amount: string;
  isPromo: boolean;
}

/** Текущая цена: минимальный amount среди активных промо, иначе subscription.amount. */
export function resolveCurrentPrice(
  subscriptionAmount: string,
  promos: PromoLike[],
  now: Date,
): ResolvedPrice {
  const active = promos.filter((p) => p.endsAt > now);
  if (active.length === 0) return { amount: subscriptionAmount, isPromo: false };
  const best = active.reduce((min, p) => (Number(p.amount) < Number(min.amount) ? p : min));
  return { amount: best.amount, isPromo: true };
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `yarn workspace @subzero/api test promo-resolver`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/subscription/promo-resolver.ts apps/api/src/subscription/promo-resolver.spec.ts
git commit -m "$(cat <<'EOF'
#85: promo-resolver — текущая цена по активным промо (min amount)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update billing-cycle для multi-promo

**Files:**
- Modify: `apps/api/src/subscription/billing-cycle.ts`
- Modify: `apps/api/src/subscription/billing-cycle.spec.ts`

- [ ] **Step 1: Update interface для `computeBackfill`**

В `billing-cycle.ts` заменить функцию `computeBackfill`:

```ts
import { resolveCurrentPrice, type PromoLike } from './promo-resolver';

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
  promos: PromoLike[];
  now: Date;
}): BackfillEntry[] {
  const cycles = countElapsedCycles(args.firstBillingDate, args.billingPeriod, args.now);
  const out: BackfillEntry[] = [];
  for (let i = 0; i < cycles; i += 1) {
    const periodStart = addPeriod(args.firstBillingDate, args.billingPeriod, i);
    const periodEnd = addPeriod(args.firstBillingDate, args.billingPeriod, i + 1);
    // Resolved price at the moment of billing (periodEnd).
    const resolved = resolveCurrentPrice(args.amount, args.promos, periodEnd);
    out.push({
      periodStart,
      periodEnd,
      billedAt: periodEnd,
      amount: resolved.amount,
      isPromo: resolved.isPromo,
    });
  }
  return out;
}
```

- [ ] **Step 2: Update tests**

В `billing-cycle.spec.ts` заменить блок `describe('computeBackfill', ...)`:

```ts
describe('computeBackfill', () => {
  const now = new Date('2026-05-21T00:00:00Z');

  it('promo применяется когда активен в момент billedAt (periodEnd)', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-02-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '500.00',
      promos: [{ amount: '0.00', endsAt: new Date('2026-04-30T00:00:00Z') }],
      now,
    });
    expect(out).toHaveLength(3);
    expect(out[0].isPromo).toBe(true);   // billedAt 2026-03-21 < 2026-04-30
    expect(out[1].isPromo).toBe(true);   // billedAt 2026-04-21 < 2026-04-30
    expect(out[2].isPromo).toBe(false);  // billedAt 2026-05-21 > 2026-04-30
    expect(out[2].amount).toBe('500.00');
  });

  it('без промо — full price на все циклы', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-03-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '300.00',
      promos: [],
      now,
    });
    expect(out).toHaveLength(2);
    expect(out.every((e) => !e.isPromo)).toBe(true);
    expect(out.every((e) => e.amount === '300.00')).toBe(true);
  });

  it('несколько промо — берётся минимальный активный', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-03-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '500.00',
      promos: [
        { amount: '300.00', endsAt: new Date('2026-06-30T00:00:00Z') },
        { amount: '100.00', endsAt: new Date('2026-06-30T00:00:00Z') },
      ],
      now,
    });
    expect(out).toHaveLength(2);
    expect(out[0].amount).toBe('100.00');
    expect(out[1].amount).toBe('100.00');
  });
});
```

- [ ] **Step 3: Run, expect PASS**

Run: `yarn workspace @subzero/api test billing-cycle`
Expected: все existing addPeriod/countElapsedCycles/nextBillingDateAfter тесты + новые computeBackfill — зелёные.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/subscription/billing-cycle.ts apps/api/src/subscription/billing-cycle.spec.ts
git commit -m "$(cat <<'EOF'
#85: billing-cycle — computeBackfill через resolveCurrentPrice (multi-promo)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: SubscriptionPromoRepository

**Files:**
- Create: `apps/api/src/subscription/subscription-promo.types.ts`
- Create: `apps/api/src/subscription/subscription-promo.repository.ts`

- [ ] **Step 1: types**

```ts
// subscription-promo.types.ts
import type { PromoDto } from '@subzero/shared';

export interface SubscriptionPromoRepository {
  listForSubscription(subscriptionId: string): Promise<PromoDto[]>;
  bulkInsert(args: {
    subscriptionId: string;
    rows: Array<{ sku: string; amount: string; endsAt: Date }>;
  }): Promise<void>;
  softDelete(sku: string, subscriptionId: string): Promise<boolean>;
  update(args: {
    sku: string;
    subscriptionId: string;
    version: number;
    patch: { amount?: string; endsAt?: Date };
  }): Promise<boolean>;
}
```

- [ ] **Step 2: Implementation**

```ts
// subscription-promo.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { PromoDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { subscriptionPromo } from '../db/schema/subscription-promo';
import type { SubscriptionPromoRepository } from './subscription-promo.types';

@Injectable()
export class DrizzleSubscriptionPromoRepository implements SubscriptionPromoRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listForSubscription(subscriptionId: string): Promise<PromoDto[]> {
    const rows = await this.db
      .select({
        sku: subscriptionPromo.sku,
        amount: subscriptionPromo.amount,
        endsAt: subscriptionPromo.endsAt,
        version: subscriptionPromo.version,
      })
      .from(subscriptionPromo)
      .where(
        and(
          eq(subscriptionPromo.subscriptionId, subscriptionId),
          isNull(subscriptionPromo.deletedAt),
        ),
      )
      .orderBy(asc(subscriptionPromo.endsAt));
    return rows.map((r) => ({
      sku: r.sku,
      amount: r.amount,
      endsAt: r.endsAt.toISOString(),
      version: r.version,
    }));
  }

  async bulkInsert(args: {
    subscriptionId: string;
    rows: Array<{ sku: string; amount: string; endsAt: Date }>;
  }): Promise<void> {
    if (args.rows.length === 0) return;
    await this.db.insert(subscriptionPromo).values(
      args.rows.map((r) => ({
        sku: r.sku,
        subscriptionId: args.subscriptionId,
        amount: r.amount,
        endsAt: r.endsAt,
      })),
    );
  }

  async softDelete(sku: string, subscriptionId: string): Promise<boolean> {
    const res = await this.db
      .update(subscriptionPromo)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(subscriptionPromo.sku, sku),
          eq(subscriptionPromo.subscriptionId, subscriptionId),
          isNull(subscriptionPromo.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }

  async update(args: {
    sku: string;
    subscriptionId: string;
    version: number;
    patch: { amount?: string; endsAt?: Date };
  }): Promise<boolean> {
    const set: Record<string, unknown> = {
      ...args.patch,
      version: sql`${subscriptionPromo.version} + 1`,
    };
    const res = await this.db
      .update(subscriptionPromo)
      .set(set)
      .where(
        and(
          eq(subscriptionPromo.sku, args.sku),
          eq(subscriptionPromo.subscriptionId, args.subscriptionId),
          eq(subscriptionPromo.version, args.version),
          isNull(subscriptionPromo.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `yarn workspace @subzero/api typecheck`
Expected: PASS (на этом этапе SubscriptionRepository ещё старый — он не использует promos, но compile должен пройти, потому что мы пока ничего не интегрировали).

Если падает — это от Task 5 (shared DTO) — потребители DTO ждём дальше.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/subscription/subscription-promo.types.ts apps/api/src/subscription/subscription-promo.repository.ts
git commit -m "$(cat <<'EOF'
#85: SubscriptionPromoRepository (drizzle)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: SubscriptionRepository — promos в DTO, hardDelete, trial_ends_at

**Files:**
- Modify: `apps/api/src/subscription/subscription.types.ts`
- Modify: `apps/api/src/subscription/subscription.repository.ts`

- [ ] **Step 1: `subscription.types.ts` — заменить методы**

```ts
import type {
  PromoDto,
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
  SubscriptionUpdateDto,
} from '@subzero/shared';

export interface SubscriptionRepository {
  findProjectIdBySku(customerId: string, projectSku: string): Promise<string | null>;
  findServiceBySku(
    sku: string,
  ): Promise<{ id: string; name: string; icon: string | null; categoryId: string } | null>;
  findCategoryIdBySku(sku: string): Promise<string | null>;
  list(customerId: string, q: SubscriptionListQuery): Promise<SubscriptionListResponse>;
  findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null>;

  /** INSERT subscription + promo (если есть) + backfill billing_history в одной транзакции. */
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
    trialEndsAt: Date | null;
    comment: string | null;
    promos: Array<{ sku: string; amount: string; endsAt: Date }>;
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

  update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: Record<string, unknown>;
  }): Promise<boolean>;

  /** HARD delete — DELETE FROM subscription (billing_history каскадно, promos каскадно). */
  hardDelete(customerId: string, sku: string): Promise<boolean>;
}

export interface SubscriptionServiceDeps {
  repo: SubscriptionRepository;
  promoRepo: import('./subscription-promo.types').SubscriptionPromoRepository;
  now: () => Date;
  generateSku: (prefix: 'sub' | 'bil' | 'spm') => string;
}
```

(Удалить экспорты `SubscriptionCreateInput` и `SubscriptionUpdateInput` — они алиасы DTO, проще импортить из shared напрямую.)

- [ ] **Step 2: `subscription.repository.ts` — крупные правки**

Изменения:

1. Переименовать метод `findServiceByCustomSku` → `findServiceBySku` (имя было misleading per ревью #84).
2. `softDelete` → `hardDelete`: заменить тело:

```ts
async hardDelete(customerId: string, sku: string): Promise<boolean> {
  const res = await this.db
    .delete(subscription)
    .where(
      and(
        eq(subscription.sku, sku),
        eq(subscription.customerId, customerId),
      ),
    );
  return (res.rowCount ?? 0) > 0;
}
```

3. `STATE_MAP`: удалить ключ `'archived'`:

```ts
const STATE_MAP: Record<SubscriptionListStatus, number[]> = {
  active: [SubscriptionState.ACTIVE],
  paused: [SubscriptionState.PAUSED],
  cancelled: [SubscriptionState.CANCELLED],
  all: [
    SubscriptionState.ACTIVE,
    SubscriptionState.PAUSED,
    SubscriptionState.CANCELLED,
  ],
};
```

4. В `list()` убрать ветку `if (q.status !== 'archived' && q.status !== 'all')` — теперь `isNull(deletedAt)` всегда (потому что архива пользователь больше не видит):

```ts
where.push(isNull(subscription.deletedAt));
where.push(inArray(subscription.stateId, states));
```

5. `toDto` — добавить `promos` (заглушку `[]`; репозиторий промо отдельно — `findBySku` JOIN'ит promos):

Расширить shape row (добавить trialEndsAt из subscription):

```ts
trialEndsAt: row.trialEndsAt ? row.trialEndsAt.toISOString() : null,
```

В возврат `SubscriptionDto`:

```ts
return {
  // ... как раньше, плюс:
  trialEndsAt: row.trialEndsAt ? row.trialEndsAt.toISOString() : null,
  promos: row.promos ?? [],
};
```

Убрать поля `promoAmount`, `promoEndsAt` из выборки и из DTO.

6. `findBySku` — после основного select делать второй select для промо (или JSON-aggregate в одном запросе для production-perf):

```ts
async findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null> {
  const [row] = await this.db
    .select({/* как раньше, без promoAmount/promoEndsAt, плюс trialEndsAt */})
    .from(subscription)
    .innerJoin(project, eq(subscription.projectId, project.id))
    .leftJoin(service, eq(subscription.serviceId, service.id))
    .leftJoin(category, eq(subscription.categoryId, category.id))
    .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
    .where(/* как раньше */)
    .limit(1);
  if (!row) return null;
  const promos = await this.db
    .select({
      sku: subscriptionPromo.sku,
      amount: subscriptionPromo.amount,
      endsAt: subscriptionPromo.endsAt,
      version: subscriptionPromo.version,
    })
    .from(subscriptionPromo)
    .where(
      and(
        eq(subscriptionPromo.subscriptionId, /* нужен id; добавить id в основной select */),
        isNull(subscriptionPromo.deletedAt),
      ),
    )
    .orderBy(asc(subscriptionPromo.endsAt));
  return toDto({ ...row, promos: promos.map(p => ({ ...p, endsAt: p.endsAt.toISOString() })) });
}
```

Для этого добавить в основной select `id: subscription.id` и в shape `toDto` тоже.

7. `list()` — `promos` сразу `[]` (для производительности; полные промо подтягиваются только по `findBySku`). UI на странице списка badges «промо» можем не показывать или показывать на основе hint-поля в будущем; на этом этапе badges «PROMO» рендерим по `dto.promos.length > 0` ТОЛЬКО на детальной форме. На страницу списка — без promo-badge (пометка для Task 13).

8. `createWithBackfill` — добавить insert в `subscription_promo` после insert в subscription, если `args.promos.length > 0`:

```ts
if (args.promos.length > 0) {
  await tx.insert(subscriptionPromo).values(
    args.promos.map((p) => ({
      sku: p.sku,
      subscriptionId: inserted.id,
      amount: p.amount,
      endsAt: p.endsAt,
    })),
  );
}
```

И — `trialEndsAt: args.trialEndsAt` в insert values.

- [ ] **Step 3: Typecheck**

Run: `yarn workspace @subzero/api typecheck`
Expected: PASS на repo. Сервис ещё может падать.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/subscription/subscription.types.ts apps/api/src/subscription/subscription.repository.ts
git commit -m "$(cat <<'EOF'
#85: SubscriptionRepository — hard delete + promos JOIN + trial_ends_at

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: SubscriptionService — trial независим, promos массив, hard delete

**Files:**
- Modify: `apps/api/src/subscription/subscription.service.ts`
- Modify: `apps/api/src/subscription/subscription.service.spec.ts`

- [ ] **Step 1: Переписать `subscription.service.ts`**

Ключевые правила:
- trial и promo — независимы.
- При `isTrial=true` обязательно требовать `trialEndsAt`.
- При `isTrial=false` — `trialEndsAt` должно быть null.
- Промо валидируются индивидуально: `0 < amount < subscription.amount` и `endsAt > now()` при create.
- `delete` теперь — hard.
- `update` — `promos` поле трактуется как replace-all (см. DTO ниже).

Полный новый файл (вместо текущего):

```ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  SubscriptionState,
  type NewPromoDto,
  type SubscriptionCreateDto,
  type SubscriptionDto,
  type SubscriptionListQuery,
  type SubscriptionListResponse,
  type SubscriptionUpdateDto,
  type UpdatePromoDto,
} from '@subzero/shared';

import { computeBackfill, nextBillingDateAfter } from './billing-cycle';
import type {
  SubscriptionRepository,
  SubscriptionServiceDeps,
} from './subscription.types';
import type { SubscriptionPromoRepository } from './subscription-promo.types';

const ALLOWED_UPDATE_STATES = new Set<number>([
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
]);

export class SubscriptionService {
  private readonly repo: SubscriptionRepository;
  private readonly promoRepo: SubscriptionPromoRepository;
  private readonly now: () => Date;
  private readonly generateSku: (p: 'sub' | 'bil' | 'spm') => string;

  constructor(deps: SubscriptionServiceDeps) {
    this.repo = deps.repo;
    this.promoRepo = deps.promoRepo;
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
    this.validateAmount(dto.amount);
    this.validateTrial(dto.isTrial, dto.trialEndsAt ?? null);
    const promos = (dto.promos ?? []).map((p) => this.validateAndNormalisePromo(p, dto.amount));

    const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
    if (!projectId) throw new NotFoundException('project not found');

    const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
    if (!categoryId) throw new NotFoundException('category not found');

    let serviceId: string | null = null;
    if (dto.serviceSku) {
      const svc = await this.repo.findServiceBySku(dto.serviceSku);
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
    const trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    const now = this.now();
    const nextBillingDate = nextBillingDateAfter(firstBillingDate, dto.billingPeriodId, now);

    const backfillEntries = computeBackfill({
      firstBillingDate,
      billingPeriod: dto.billingPeriodId,
      amount: dto.amount,
      promos: promos.map((p) => ({ amount: p.amount, endsAt: p.endsAt })),
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
      trialEndsAt,
      comment: (dto.comment ?? '').trim() || null,
      promos: promos.map((p) => ({
        sku: this.generateSku('spm'),
        amount: p.amount,
        endsAt: p.endsAt,
      })),
      backfill,
    });
  }

  async update(
    customerId: string,
    sku: string,
    dto: SubscriptionUpdateDto,
  ): Promise<SubscriptionDto> {
    if (dto.stateId !== undefined && !ALLOWED_UPDATE_STATES.has(dto.stateId)) {
      throw new BadRequestException('stateId=ARCHIVED is reserved');
    }
    if (dto.amount !== undefined) this.validateAmount(dto.amount);

    // Get existing once if needed (for trial/promo validation or recompute next).
    const needsExisting =
      dto.isTrial !== undefined ||
      dto.trialEndsAt !== undefined ||
      dto.promos !== undefined ||
      dto.firstBillingDate !== undefined ||
      dto.billingPeriodId !== undefined;
    let existing: SubscriptionDto | null = null;
    if (needsExisting) {
      existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
    }

    if (dto.isTrial !== undefined || dto.trialEndsAt !== undefined) {
      const isTrial = dto.isTrial ?? existing!.isTrial;
      const trialEndsAt =
        dto.trialEndsAt !== undefined
          ? dto.trialEndsAt
          : existing!.trialEndsAt;
      this.validateTrial(isTrial, trialEndsAt);
    }

    const patch: Record<string, unknown> = {};
    if (dto.nameCustom !== undefined) patch.nameCustom = (dto.nameCustom ?? '').trim() || null;
    if (dto.iconCustom !== undefined) patch.iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currencyId = dto.currencyId;
    if (dto.billingPeriodId !== undefined) patch.billingPeriodId = dto.billingPeriodId;
    if (dto.firstBillingDate !== undefined) patch.firstBillingDate = new Date(dto.firstBillingDate);
    if (dto.isTrial !== undefined) patch.isTrial = dto.isTrial;
    if (dto.trialEndsAt !== undefined) {
      patch.trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    }
    if (dto.comment !== undefined) patch.comment = (dto.comment ?? '').trim() || null;
    if (dto.stateId !== undefined) patch.stateId = dto.stateId;

    if (dto.projectSku !== undefined) {
      const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
      if (!projectId) throw new NotFoundException('project not found');
      patch.projectId = projectId;
    }
    if (dto.categorySku !== undefined) {
      const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
      if (!categoryId) throw new NotFoundException('category not found');
      patch.categoryId = categoryId;
    }
    if (dto.serviceSku !== undefined) {
      if (dto.serviceSku === null) {
        patch.serviceId = null;
      } else {
        const svc = await this.repo.findServiceBySku(dto.serviceSku);
        if (!svc) throw new NotFoundException('service not found');
        patch.serviceId = svc.id;
      }
    }

    if (dto.firstBillingDate !== undefined || dto.billingPeriodId !== undefined) {
      const firstBillingDate = dto.firstBillingDate
        ? new Date(dto.firstBillingDate)
        : new Date(existing!.firstBillingDate);
      const billingPeriodId = dto.billingPeriodId ?? existing!.billingPeriodId;
      patch.nextBillingDate = nextBillingDateAfter(firstBillingDate, billingPeriodId, this.now());
    }

    const hasMainPatch = Object.keys(patch).length > 0;
    const hasPromoPatch = dto.promos !== undefined;
    if (!hasMainPatch && !hasPromoPatch) {
      throw new BadRequestException('no fields to update');
    }

    if (hasMainPatch) {
      const ok = await this.repo.update({
        customerId,
        sku,
        version: dto.version,
        patch,
      });
      if (!ok) {
        const after = existing ?? (await this.repo.findBySku(customerId, sku));
        if (!after) throw new NotFoundException('subscription not found');
        throw new ConflictException('version mismatch');
      }
    }

    if (hasPromoPatch) {
      const fresh = (await this.repo.findBySku(customerId, sku))!;
      const subscriptionAmount = (patch.amount as string | undefined) ?? fresh.amount;
      await this.syncPromos(fresh, dto.promos!, subscriptionAmount);
    }

    const after = await this.repo.findBySku(customerId, sku);
    if (!after) throw new NotFoundException('subscription not found');
    return after;
  }

  async delete(customerId: string, sku: string): Promise<void> {
    const ok = await this.repo.hardDelete(customerId, sku);
    if (!ok) throw new NotFoundException('subscription not found');
  }

  // ---- private helpers ----

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('amount must be > 0');
  }

  private validateTrial(isTrial: boolean, trialEndsAt: string | null): void {
    if (isTrial && !trialEndsAt) {
      throw new UnprocessableEntityException('trial requires trialEndsAt');
    }
    if (!isTrial && trialEndsAt) {
      throw new UnprocessableEntityException('trialEndsAt must be null when isTrial=false');
    }
  }

  private validateAndNormalisePromo(
    p: NewPromoDto,
    subscriptionAmount: string,
  ): { amount: string; endsAt: Date } {
    const amount = Number(p.amount);
    const subAmount = Number(subscriptionAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount >= subAmount) {
      throw new UnprocessableEntityException('promo amount must be > 0 and < subscription amount');
    }
    const endsAt = new Date(p.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('promo endsAt is invalid');
    }
    return { amount: p.amount, endsAt };
  }

  private async syncPromos(
    sub: SubscriptionDto,
    next: Array<NewPromoDto | UpdatePromoDto>,
    subscriptionAmount: string,
  ): Promise<void> {
    // Replace-all: то что прислали с sku — апдейт по optimistic lock; новые без sku — вставка;
    // то что было в DB но не пришло — soft-delete.
    const existingBySku = new Map(sub.promos.map((p) => [p.sku, p]));
    const incomingSkus = new Set<string>();

    const subId = await this.findSubIdOrThrow(sub);

    for (const item of next) {
      if ('sku' in item) {
        // Update path.
        incomingSkus.add(item.sku);
        const ex = existingBySku.get(item.sku);
        if (!ex) throw new NotFoundException('promo not found');
        if (item.amount !== undefined || item.endsAt !== undefined) {
          const amount = item.amount ?? ex.amount;
          this.validateAndNormalisePromo({ amount, endsAt: item.endsAt ?? ex.endsAt }, subscriptionAmount);
          const ok = await this.promoRepo.update({
            sku: item.sku,
            subscriptionId: subId,
            version: item.version,
            patch: {
              amount: item.amount,
              endsAt: item.endsAt ? new Date(item.endsAt) : undefined,
            },
          });
          if (!ok) throw new ConflictException('promo version mismatch');
        }
      } else {
        // Insert path.
        const norm = this.validateAndNormalisePromo(item, subscriptionAmount);
        await this.promoRepo.bulkInsert({
          subscriptionId: subId,
          rows: [{ sku: this.generateSku('spm'), amount: norm.amount, endsAt: norm.endsAt }],
        });
      }
    }

    // Delete missing.
    for (const ex of sub.promos) {
      if (!incomingSkus.has(ex.sku)) {
        await this.promoRepo.softDelete(ex.sku, subId);
      }
    }
  }

  /** SubscriptionDto не несёт internal id; нужен для promo-repo. Получаем повторным запросом. */
  private async findSubIdOrThrow(sub: SubscriptionDto): Promise<string> {
    // findBySku в текущем repo возвращает DTO без id — но createWithBackfill идёт через tx.
    // Для update-флоу нам нужен ID; добавим в SubscriptionRepository метод resolveId(sku, customerId).
    // (См. Task 9 extra: добавить метод findIdBySku.)
    throw new Error('not implemented — see Task 9 extra');
  }
}
```

> Этот стаб `findSubIdOrThrow` — точка интеграции. В Task 9 нужно ДОПОЛНИТЕЛЬНО добавить в `SubscriptionRepository` метод `findIdBySku(customerId, sku): Promise<string | null>`. Если Task 9 ещё не предусматривал — добавляется здесь (см. Step 2 ниже).

- [ ] **Step 2: Добавить `findIdBySku` в `subscription.types.ts` и `subscription.repository.ts`**

В `subscription.types.ts`, в интерфейс `SubscriptionRepository`, добавить:

```ts
findIdBySku(customerId: string, sku: string): Promise<string | null>;
```

В `subscription.repository.ts`, добавить метод:

```ts
async findIdBySku(customerId: string, sku: string): Promise<string | null> {
  const [row] = await this.db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.sku, sku),
        eq(subscription.customerId, customerId),
        isNull(subscription.deletedAt),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}
```

И в сервисе заменить заглушку:

```ts
private async findSubIdOrThrow(sub: SubscriptionDto): Promise<string> {
  // Этот метод вызывается из update-флоу — sub уже получен через findBySku → существует.
  // findIdBySku здесь — тривиальная локализация UUID, чтобы не таскать его через DTO.
  // Если запись пропала между findBySku и тут — это race, NotFoundException.
  throw new Error('use repo.findIdBySku via _findSubId');
}
```

И поменять сигнатуру `syncPromos` чтобы принимать `subId: string` напрямую. Вызывающий код:

```ts
if (hasPromoPatch) {
  const fresh = (await this.repo.findBySku(customerId, sku))!;
  const subId = await this.repo.findIdBySku(customerId, sku);
  if (!subId) throw new NotFoundException('subscription not found');
  const subscriptionAmount = (patch.amount as string | undefined) ?? fresh.amount;
  await this.syncPromos(subId, fresh, dto.promos!, subscriptionAmount);
}
```

И:

```ts
private async syncPromos(
  subId: string,
  sub: SubscriptionDto,
  next: Array<NewPromoDto | UpdatePromoDto>,
  subscriptionAmount: string,
): Promise<void> { /* ... уже использует subId напрямую ... */ }
```

(удалить `findSubIdOrThrow`).

- [ ] **Step 3: Tests** — `subscription.service.spec.ts`

Заменить блок из старого PR. Полный новый файл (показываю целиком, чтобы было воспроизводимо):

```ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

import { SubscriptionService } from './subscription.service';
import type { SubscriptionRepository } from './subscription.types';
import type { SubscriptionPromoRepository } from './subscription-promo.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const PROJECT_ID = 'p0000000-0000-0000-0000-000000000001';
const CAT_ID = 'cat0000-0000-0000-0000-000000000001';
const SUB_ID = 's0000000-0000-0000-0000-000000000001';

function makeRepo(): jest.Mocked<SubscriptionRepository> {
  return {
    findProjectIdBySku: jest.fn().mockResolvedValue(PROJECT_ID),
    findServiceBySku: jest.fn().mockResolvedValue(null),
    findCategoryIdBySku: jest.fn().mockResolvedValue(CAT_ID),
    findIdBySku: jest.fn().mockResolvedValue(SUB_ID),
    list: jest.fn(),
    findBySku: jest.fn(),
    createWithBackfill: jest.fn(),
    update: jest.fn().mockResolvedValue(true),
    hardDelete: jest.fn().mockResolvedValue(true),
  };
}

function makePromoRepo(): jest.Mocked<SubscriptionPromoRepository> {
  return {
    listForSubscription: jest.fn().mockResolvedValue([]),
    bulkInsert: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  };
}

function makeService(now = new Date('2026-05-22T00:00:00Z')) {
  const repo = makeRepo();
  const promoRepo = makePromoRepo();
  const skuSeq = { sub: 0, bil: 0, spm: 0 };
  const generateSku = (p: 'sub' | 'bil' | 'spm') => `${p}-FAKE${++skuSeq[p]}`;
  const service = new SubscriptionService({ repo, promoRepo, now: () => now, generateSku });
  return { service, repo, promoRepo };
}

function basePayload(over: Partial<Parameters<SubscriptionService['create']>[1]> = {}) {
  return {
    projectSku: 'prj-ABCDEFGH',
    serviceSku: null,
    nameCustom: 'My Subscription',
    iconCustom: null,
    categorySku: 'cat-video',
    amount: '500.00',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '2026-04-01T00:00:00Z',
    isTrial: false,
    trialEndsAt: null,
    comment: null,
    promos: [],
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

  it('rejects isTrial=true без trialEndsAt (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ isTrial: true, trialEndsAt: null })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects isTrial=false с trialEndsAt (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ isTrial: false, trialEndsAt: '2026-08-01T00:00:00Z' })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects promo amount >= subscription amount (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({
        promos: [{ amount: '600.00', endsAt: '2026-08-01T00:00:00Z' }],
      })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('SubscriptionService.create — happy path', () => {
  it('передаёт промо в repo и backfill использует resolveCurrentPrice', async () => {
    const { service, repo } = makeService(new Date('2026-05-22T00:00:00Z'));
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
      firstBillingDate: '2026-04-01T00:00:00.000Z',
      nextBillingDate: '2026-06-01T00:00:00.000Z',
      isTrial: false,
      trialEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 1,
      createdAt: '',
      updatedAt: '',
      promos: [],
    });

    await service.create(CID, basePayload({
      firstBillingDate: '2026-04-01T00:00:00Z',
      promos: [{ amount: '100.00', endsAt: '2026-07-01T00:00:00Z' }],
    }));

    const args = repo.createWithBackfill.mock.calls[0]![0];
    expect(args.promos).toHaveLength(1);
    expect(args.promos[0].sku).toMatch(/^spm-/);
    expect(args.backfill[0].amount).toBe('100.00'); // promo активен в момент первого billedAt
    expect(args.backfill[0].isPromo).toBe(true);
  });
});

describe('SubscriptionService.delete', () => {
  it('hard delete; 404 если не найдена', async () => {
    const { service, repo } = makeService();
    repo.hardDelete.mockResolvedValue(false);
    await expect(service.delete(CID, 'sub-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('zовёт repo.hardDelete при успехе', async () => {
    const { service, repo } = makeService();
    repo.hardDelete.mockResolvedValue(true);
    await service.delete(CID, 'sub-1');
    expect(repo.hardDelete).toHaveBeenCalledWith(CID, 'sub-1');
  });
});

describe('SubscriptionService.update — promos sync', () => {
  it('добавляет, обновляет и удаляет промо по replace-all семантике', async () => {
    const { service, repo, promoRepo } = makeService();
    const existing = {
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      categorySku: 'cat-video', categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '',
      promos: [
        { sku: 'spm-OLD',  amount: '200.00', endsAt: '2026-09-01T00:00:00Z', version: 1 },
        { sku: 'spm-KEEP', amount: '100.00', endsAt: '2026-10-01T00:00:00Z', version: 2 },
      ],
    };
    repo.findBySku.mockResolvedValue(existing);

    await service.update(CID, 'sub-1', {
      version: 5,
      promos: [
        { sku: 'spm-KEEP', version: 2, amount: '90.00' }, // update existing
        { amount: '50.00', endsAt: '2026-12-01T00:00:00Z' }, // new
      ],
    });

    expect(promoRepo.update).toHaveBeenCalledWith(expect.objectContaining({ sku: 'spm-KEEP' }));
    expect(promoRepo.bulkInsert).toHaveBeenCalledWith(expect.objectContaining({
      rows: expect.arrayContaining([expect.objectContaining({ amount: '50.00' })]),
    }));
    expect(promoRepo.softDelete).toHaveBeenCalledWith('spm-OLD', SUB_ID);
  });

  it('409 на устаревший version основной подписки', async () => {
    const { service, repo } = makeService();
    repo.update.mockResolvedValue(false);
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      categorySku: null, categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '', promos: [],
    });
    await expect(
      service.update(CID, 'sub-1', { version: 4, comment: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `yarn workspace @subzero/api test subscription.service`
Expected: PASS (минимум 10 тестов).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/subscription/subscription.types.ts apps/api/src/subscription/subscription.repository.ts apps/api/src/subscription/subscription.service.ts apps/api/src/subscription/subscription.service.spec.ts
git commit -m "$(cat <<'EOF'
#85: SubscriptionService — multi-promo + trial независим + hard delete

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: DTO + Controller + Module — wiring

**Files:**
- Modify: `apps/api/src/subscription/dto/create-subscription.dto.ts`
- Modify: `apps/api/src/subscription/dto/update-subscription.dto.ts`
- Modify: `apps/api/src/subscription/dto/list-subscriptions.dto.ts`
- Modify: `apps/api/src/subscription/subscription.module.ts`

- [ ] **Step 1: `create-subscription.dto.ts`**

Удалить поля `promoAmount`, `promoEndsAt`. Добавить:

```ts
@IsOptional()
@IsISO8601()
trialEndsAt?: string | null;

@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => NewPromoInDto)
promos?: NewPromoInDto[];
```

Где `NewPromoInDto` — отдельный класс в том же файле:

```ts
class NewPromoInDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsISO8601()
  endsAt!: string;
}
```

Импортить `IsArray, ValidateNested, Type` соответственно.

- [ ] **Step 2: `update-subscription.dto.ts`**

То же самое + дискриминированный union для promos через два класса (`NewPromoInDto` + `UpdatePromoInDto`). Чтобы не возиться с union — используем массив объектов с опциональным `sku`:

```ts
class PromoInDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}
```

И в Update-DTO:

```ts
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => PromoInDto)
promos?: PromoInDto[];

@IsOptional()
@IsISO8601()
trialEndsAt?: string | null;
```

Удалить `promoAmount`, `promoEndsAt`. (Сервис сам валидирует sku + version при update-пути.)

- [ ] **Step 3: `list-subscriptions.dto.ts`**

Заменить:

```ts
const STATUSES = ['active', 'paused', 'cancelled', 'all'] as const;
```

(убрать `'archived'`).

- [ ] **Step 4: `subscription.module.ts`**

Дописать `DrizzleSubscriptionPromoRepository` в providers и в `useFactory`:

```ts
import { DrizzleSubscriptionPromoRepository } from './subscription-promo.repository';
// ...
providers: [
  DrizzleSubscriptionRepository,
  DrizzleSubscriptionPromoRepository,
  {
    provide: SubscriptionService,
    useFactory: (
      repo: DrizzleSubscriptionRepository,
      promoRepo: DrizzleSubscriptionPromoRepository,
    ) =>
      new SubscriptionService({
        repo,
        promoRepo,
        now: () => new Date(),
        generateSku,
      }),
    inject: [DrizzleSubscriptionRepository, DrizzleSubscriptionPromoRepository],
  },
],
```

- [ ] **Step 5: Typecheck + lint + tests**

```bash
yarn workspace @subzero/api typecheck
yarn workspace @subzero/api lint
yarn workspace @subzero/api test
```

Expected: всё зелёное.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/subscription
git commit -m "$(cat <<'EOF'
#85: DTO + module — promos массив, trialEndsAt, без archived в фильтре

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: e2e — обновить под hard delete + multi-promo

**Files:**
- Modify: `apps/api/src/subscription/subscription.e2e.int.spec.ts`

- [ ] **Step 1: Заменить тест архива на тест hard-delete**

В существующем `describe('Subscriptions e2e')`, в `it('create → list → get → update → delete → archived list')`:

Заменить финальную часть после `removed = http.delete(...)`:

```ts
const removed = await http.delete(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
expect(removed.status).toBe(204);

const afterDelete = await http.get(`${PFX}/subscriptions`).set('Cookie', cookies);
expect(afterDelete.body.items).toHaveLength(0);

// Hard-delete: записи в subscription и billing_history физически удалены.
const subCount = await testPool().query(
  'SELECT COUNT(*)::int AS n FROM subscription WHERE sku = $1',
  [sku],
);
expect(subCount.rows[0].n).toBe(0);

const historyCount = await testPool().query(
  'SELECT COUNT(*)::int AS n FROM billing_history WHERE subscription_id = (SELECT id FROM subscription WHERE sku = $1)',
  [sku],
);
expect(historyCount.rows[0].n).toBe(0);
```

Переименовать `it()`:

```ts
it('create → list → get → update → hard delete', async () => {
```

- [ ] **Step 2: Новый тест на multi-promo**

Добавить новый `it()` в тот же describe:

```ts
it('create с двумя промо, update меняет/добавляет/удаляет', async () => {
  const created = await http
    .post(`${PFX}/subscriptions`)
    .set('Cookie', cookies)
    .send({
      projectSku,
      categorySku,
      nameCustom: 'Multi-promo Sub',
      amount: '500.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: new Date().toISOString(),
      isTrial: false,
      trialEndsAt: null,
      promos: [
        { amount: '100.00', endsAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString() },
        { amount: '50.00',  endsAt: new Date(Date.now() + 60 * 86400 * 1000).toISOString() },
      ],
    });
  expect(created.status).toBe(201);
  expect(created.body.promos).toHaveLength(2);

  const sku = created.body.sku as string;
  const got = await http.get(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
  const promo1 = got.body.promos[0];

  // Удалить один промо, обновить другой, добавить новый.
  const upd = await http
    .post(`${PFX}/subscriptions/${sku}`)
    .set('Cookie', cookies)
    .send({
      version: got.body.version,
      promos: [
        { sku: promo1.sku, version: promo1.version, amount: '80.00' },
        { amount: '200.00', endsAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString() },
      ],
    });
  expect(upd.status).toBe(200);
  expect(upd.body.promos).toHaveLength(2);
  const amounts = upd.body.promos.map((p: { amount: string }) => p.amount).sort();
  expect(amounts).toEqual(['200.00', '80.00']);
});

it('trial и promo могут сосуществовать', async () => {
  const r = await http
    .post(`${PFX}/subscriptions`)
    .set('Cookie', cookies)
    .send({
      projectSku, categorySku,
      nameCustom: 'Trial+Promo',
      amount: '300.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: new Date().toISOString(),
      isTrial: true,
      trialEndsAt: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      promos: [{ amount: '150.00', endsAt: new Date(Date.now() + 60 * 86400 * 1000).toISOString() }],
    });
  expect(r.status).toBe(201);
  expect(r.body.isTrial).toBe(true);
  expect(r.body.trialEndsAt).toBeTruthy();
  expect(r.body.promos).toHaveLength(1);
});
```

- [ ] **Step 3: Run**

Run: `yarn workspace @subzero/api test subscription.e2e`
Expected: все existing e2e + новые — зелёные.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/subscription/subscription.e2e.int.spec.ts
git commit -m "$(cat <<'EOF'
#85: e2e — hard delete + multi-promo + trial+promo coexistence

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Frontend — кастомный DatePicker

**Files:**
- Create: `apps/web/src/shared/components/ui/SubDatePicker.tsx`

- [ ] **Step 1: Скопировать компонент из дизайна**

Прочесть `/tmp/sub0-design/sub0/project/cabinet-subs.jsx` строки **242-365** (`function DatePicker`) и **365-373** (`navBtn`, `quickBtn`).

Переписать в TypeScript-React-FC, использовать существующие токены SUB0 / mono из `@/shared/constants/tokens`:

```tsx
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';

interface Props {
  value: string;                         // 'YYYY-MM-DD' или ''
  onChange: (v: string) => void;
  placeholder?: string;
}

const monthRu = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const monthEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthNameLong(m: number, lang: 'ru' | 'en'): string {
  return (lang === 'en' ? monthEn : monthRu)[m];
}

const navBtn: CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: `1px solid ${SUB0.line}`,
  background: SUB0.panel, color: SUB0.ink, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
};

const quickBtn: CSSProperties = {
  flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${SUB0.line}`,
  background: SUB0.panel, color: SUB0.ink, fontSize: 12, fontFamily: mono, fontWeight: 600, cursor: 'pointer',
};

export function SubDatePicker({ value, onChange, placeholder }: Props) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const parsed = value ? value.split('-').map(Number) : null;
  const today = new Date();
  const initial = parsed
    ? new Date(parsed[0], parsed[1] - 1, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const [view, setView] = useState(initial);

  const display = parsed
    ? `${parsed[2]} ${monthNameLong(parsed[1] - 1, lang as 'ru' | 'en')} ${parsed[0]}`
    : '';

  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysPrev = new Date(y, m, 0).getDate();

  const cells: Array<{ d: number; mo: -1 | 0 | 1 }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ d: daysPrev - firstDow + 1 + i, mo: -1 });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, mo: 0 });
  while (cells.length < 42) cells.push({ d: cells.length - daysInMonth - firstDow + 1, mo: 1 });

  const isSelected = (cell: { d: number; mo: number }) =>
    parsed != null && cell.mo === 0 && parsed[0] === y && parsed[1] - 1 === m && parsed[2] === cell.d;
  const isToday = (cell: { d: number; mo: number }) =>
    cell.mo === 0 && y === today.getFullYear() && m === today.getMonth() && cell.d === today.getDate();

  const pick = (cell: { d: number; mo: number }) => {
    let py = y, pm = m, pd = cell.d;
    if (cell.mo === -1) { pm -= 1; if (pm < 0) { pm = 11; py -= 1; } }
    if (cell.mo === 1)  { pm += 1; if (pm > 11) { pm = 0;  py += 1; } }
    const mm = String(pm + 1).padStart(2, '0');
    const dd = String(pd).padStart(2, '0');
    onChange(`${py}-${mm}-${dd}`);
    setOpen(false);
  };

  const dows = lang === 'en'
    ? ['Mo','Tu','We','Th','Fr','Sa','Su']
    : ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 12px', borderRadius: 8,
          border: `1px solid ${open ? SUB0.ink : SUB0.line}`,
          background: SUB0.panel, color: parsed ? SUB0.ink : SUB0.muted,
          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
          transition: 'border-color .12s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: parsed ? 600 : 400 }}>
          {display || placeholder || t('Выберите дату', 'Pick a date')}
        </span>
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 280,
          background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 12,
          boxShadow: '0 16px 40px -16px rgba(10,10,10,.18)', padding: 12, zIndex: 90,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} style={navBtn}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, letterSpacing: '0.02em' }}>
              {monthNameLong(m, lang as 'ru' | 'en')} {y}
            </div>
            <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} style={navBtn}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {dows.map((d) => (
              <div key={d} style={{ fontSize: 10, fontFamily: mono, color: SUB0.muted, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((cell, i) => {
              const sel = isSelected(cell);
              const t_ = isToday(cell);
              const dim = cell.mo !== 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(cell)}
                  style={{
                    padding: '6px 0', borderRadius: 6,
                    border: t_ && !sel ? `1px solid ${SUB0.line}` : '1px solid transparent',
                    background: sel ? SUB0.ink : 'transparent',
                    color: sel ? SUB0.bg : dim ? '#bdbcb4' : SUB0.ink,
                    fontFamily: mono, fontSize: 12, fontWeight: sel ? 700 : 500, cursor: 'pointer',
                  }}
                >
                  {cell.d}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${SUB0.line}` }}>
            <button type="button" onClick={() => {
              const td = new Date();
              const mm = String(td.getMonth() + 1).padStart(2, '0');
              const dd = String(td.getDate()).padStart(2, '0');
              onChange(`${td.getFullYear()}-${mm}-${dd}`);
              setOpen(false);
            }} style={quickBtn}>{t('Сегодня', 'Today')}</button>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} style={quickBtn}>
              {t('Очистить', 'Clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn workspace @subzero/web typecheck`
Expected: PASS (компонент ещё не используется).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/components/ui/SubDatePicker.tsx
git commit -m "$(cat <<'EOF'
#85: SubDatePicker — кастомный календарь по дизайну

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Frontend — display-next helper

**Files:**
- Create: `apps/web/src/shared/lib/date.ts`
- Create: `apps/web/src/shared/lib/date.spec.ts` (Jest)

> Если в `apps/web` нет Jest — пропустить spec, оставить только `date.ts`. Проверь `apps/web/package.json` на наличие test-скрипта; если нет, инлайн test пропусти и положись на typecheck.

- [ ] **Step 1: `date.ts`**

```ts
export interface ResolvedDisplay {
  /** ISO date that should be shown to the user (UTC). */
  displayIso: string;
  /** True if displayIso falls within today in the customer's timezone. */
  isToday: boolean;
}

function addPeriod(d: Date, period: 'MONTH' | 'YEAR', n: number): Date {
  const out = new Date(d.getTime());
  if (period === 'MONTH') out.setUTCMonth(out.getUTCMonth() + n);
  else out.setUTCFullYear(out.getUTCFullYear() + n);
  return out;
}

/**
 * View-time recompute of nextBillingDate:
 * - Если nextBillingDate уже сегодня (по TZ customer'а) — оставляем (isToday=true).
 * - Если в прошлом — сдвигаем по сетке firstBillingDate+i*period до первого слота >= startOfToday.
 * - Если в будущем — оставляем.
 *
 * Cron в v1.1 будет делать это серверно; пока — view-time.
 */
export function displayNextBillingDate(args: {
  firstBillingDate: string;
  nextBillingDate: string;
  billingPeriod: 'MONTH' | 'YEAR';
  now?: Date;
  timezone?: string;
}): ResolvedDisplay {
  const now = args.now ?? new Date();
  const tz = args.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  // startOfToday в TZ → UTC. Простая реализация без библиотек: берём текущую дату в TZ как Y/M/D,
  // строим Date(Y, M, D) в UTC.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);
  const startOfToday = new Date(Date.UTC(y, m - 1, d));
  const startOfTomorrow = new Date(Date.UTC(y, m - 1, d + 1));

  const next = new Date(args.nextBillingDate);

  // Если nextBillingDate в [startOfToday, startOfTomorrow) — сегодня.
  if (next >= startOfToday && next < startOfTomorrow) {
    return { displayIso: next.toISOString(), isToday: true };
  }
  // Если в будущем — оставляем как есть.
  if (next >= startOfTomorrow) {
    return { displayIso: next.toISOString(), isToday: false };
  }
  // Если в прошлом — сдвигаем от firstBillingDate по сетке.
  const first = new Date(args.firstBillingDate);
  let n = 0;
  let candidate = first;
  while (candidate < startOfToday) {
    n += 1;
    candidate = addPeriod(first, args.billingPeriod, n);
    if (n > 1200) break; // защита от бесконечного цикла (100 лет помесячно)
  }
  const isToday = candidate >= startOfToday && candidate < startOfTomorrow;
  return { displayIso: candidate.toISOString(), isToday };
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn workspace @subzero/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/lib/date.ts
git commit -m "$(cat <<'EOF'
#85: displayNextBillingDate — view-time recompute с подсветкой сегодняшних

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: SubsListView — today highlight, «Сегодня» label, без архив-фильтра

**Files:**
- Modify: `apps/web/src/_pages/subscriptions/ui/SubsListView.tsx`

- [ ] **Step 1: Удалить `archived` из статус-опций**

Найти массив `statusOptions` и убрать строку:

```ts
{ v: 'archive', l: t('В архиве', 'Archived') },
```

(а также соответствующий маппинг status-фильтра, если есть). В типе `StatusFilter` убрать `'archive'`.

- [ ] **Step 2: Подставить display-next для каждой строки**

В рендере списка (`SubsList`/`SubsGrid`) импортить `displayNextBillingDate`:

```ts
import { displayNextBillingDate } from '@/shared/lib/date';
import { BillingPeriod } from '@subzero/shared';
```

Для каждой подписки вычислить:

```ts
const display = displayNextBillingDate({
  firstBillingDate: r.firstBillingDate,
  nextBillingDate: r.nextBillingDate,
  billingPeriod: r.billingPeriodId === BillingPeriod.YEAR ? 'YEAR' : 'MONTH',
});
const nextDate = new Date(display.displayIso);
```

И в колонке «Списание» рендерить:

```ts
{display.isToday
  ? <span style={{ color: SUB0.blue, fontWeight: 700 }}>{t('Сегодня', 'Today')}</span>
  : `${nextDate.getDate()} ${monthShort(nextDate.getMonth(), lang).toLowerCase()}`}
```

- [ ] **Step 3: Подсветка строки**

В корне `<div onClick={() => onEdit(r)} ...>` (desktop) добавить style:

```ts
style={{
  // ...existing props,
  border: display.isToday ? `1px solid ${SUB0.blue}` : undefined,
  background: display.isToday ? `${SUB0.blue}08` : undefined,
  borderRadius: display.isToday ? 8 : undefined,
}}
```

(аккуратно: не сломать существующие background hover-эффекты — вынеси «сегодня» в `data-attribute` если надо, либо просто оставь как inline style, hover пусть будет subtle).

В мобильной grid `<Card>` — добавить такой же accent.

- [ ] **Step 4: Verify в браузере**

Run: `yarn dev`. Создать подписку с `firstBillingDate=today` — должна быть подсвечена и показывать «Сегодня». Создать другую с датой 5 дней назад → должна показывать актуальную (сдвинутую вперёд) дату.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/_pages/subscriptions/ui/SubsListView.tsx
git commit -m "$(cat <<'EOF'
#85: subscriptions list — подсветка сегодняшних + удалён архив-фильтр

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: SubscriptionForm — секции 01/02/03 + live summary + multi-promo

**Files:**
- Modify: `apps/web/src/features/subscription-form/types.ts`
- Modify: `apps/web/src/features/subscription-form/ui/SubscriptionForm.tsx`

Это самая объёмная UI-задача. Полностью переписать форму по образцу `cabinet-subs.jsx:1165-1623` (`DetailsForm`). Используем:
- `SubDatePicker` вместо native date input
- секции 01 Описание / 02 Старт подписки / 03 Особые периоды
- live summary (длительность, всего списаний, потрачено)
- multi-promo UI (state.promos: PromoState[])
- ServicePickerInline сверху (для new)
- toggle «Новая / Уже пользуюсь» (только new)
- `suggestedNext` подсказка

- [ ] **Step 1: types.ts** — обновить state модель

```ts
import type { SubscriptionDto } from '@subzero/shared';

export interface PromoState {
  /** undefined для нового; sku для существующего. */
  sku?: string;
  version?: number;
  amount: string;
  endsAt: string; // 'YYYY-MM-DD'
}

export interface SubscriptionFormState {
  sku?: string;
  version?: number;

  /** new | existing — только для UI mode toggle на странице создания. */
  mode: 'new' | 'existing';

  projectSku: string;
  serviceSku: string | null;

  nameCustom: string;
  iconCustom: string | null;

  categorySku: string;

  amount: string;
  currencyId: number;
  billingPeriodId: number;
  firstBillingDate: string;   // 'YYYY-MM-DD' или ''
  nextBillingDate: string;    // 'YYYY-MM-DD'

  isTrial: boolean;
  trialEndsAt: string;        // 'YYYY-MM-DD' или ''

  comment: string;

  stateId?: number;

  promos: PromoState[];
}

function isoToDateStr(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function dateStrToIso(dateStr: string): string {
  // 'YYYY-MM-DD' → '...T00:00:00Z'
  return `${dateStr}T00:00:00Z`;
}

export function fromDto(dto: SubscriptionDto): SubscriptionFormState {
  return {
    sku: dto.sku,
    version: dto.version,
    mode: 'existing',
    projectSku: dto.projectSku,
    serviceSku: dto.serviceSku,
    nameCustom: dto.name,
    iconCustom: null,
    categorySku: dto.categorySku ?? '',
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    firstBillingDate: isoToDateStr(dto.firstBillingDate),
    nextBillingDate: isoToDateStr(dto.nextBillingDate),
    isTrial: dto.isTrial,
    trialEndsAt: isoToDateStr(dto.trialEndsAt),
    comment: dto.comment ?? '',
    stateId: dto.stateId,
    promos: dto.promos.map((p) => ({
      sku: p.sku,
      version: p.version,
      amount: p.amount,
      endsAt: isoToDateStr(p.endsAt),
    })),
  };
}

export function toCreateDto(state: SubscriptionFormState) {
  return {
    projectSku: state.projectSku,
    serviceSku: state.serviceSku || null,
    nameCustom: state.serviceSku ? null : state.nameCustom.trim() || null,
    iconCustom: state.iconCustom?.trim() || null,
    categorySku: state.categorySku,
    amount: state.amount,
    currencyId: state.currencyId,
    billingPeriodId: state.billingPeriodId,
    firstBillingDate: dateStrToIso(state.firstBillingDate || state.nextBillingDate),
    isTrial: state.isTrial,
    trialEndsAt: state.trialEndsAt ? dateStrToIso(state.trialEndsAt) : null,
    comment: state.comment.trim() || null,
    promos: state.promos
      .filter((p) => p.amount && p.endsAt)
      .map((p) => ({
        amount: p.amount,
        endsAt: dateStrToIso(p.endsAt),
      })),
  };
}

export function toUpdateDto(state: SubscriptionFormState) {
  if (state.version == null) throw new Error('toUpdateDto: version missing');
  return {
    version: state.version,
    projectSku: state.projectSku,
    serviceSku: state.serviceSku ?? null,
    nameCustom: state.serviceSku ? null : state.nameCustom.trim() || null,
    iconCustom: state.iconCustom?.trim() || null,
    categorySku: state.categorySku,
    amount: state.amount,
    currencyId: state.currencyId,
    billingPeriodId: state.billingPeriodId,
    firstBillingDate: state.firstBillingDate ? dateStrToIso(state.firstBillingDate) : undefined,
    isTrial: state.isTrial,
    trialEndsAt: state.trialEndsAt ? dateStrToIso(state.trialEndsAt) : null,
    comment: state.comment.trim() || null,
    stateId: state.stateId,
    promos: state.promos
      .filter((p) => p.amount && p.endsAt)
      .map((p) => {
        if (p.sku && p.version != null) {
          return { sku: p.sku, version: p.version, amount: p.amount, endsAt: dateStrToIso(p.endsAt) };
        }
        return { amount: p.amount, endsAt: dateStrToIso(p.endsAt) };
      }),
  };
}
```

- [ ] **Step 2: SubscriptionForm.tsx** — переписать с секциями

Из-за объёма (≈700 строк целевой код) — план не приводит весь файл. Действия:

1. Прочитать `/tmp/sub0-design/sub0/project/cabinet-subs.jsx:1165-1623` (`DetailsForm`) как образец.
2. Адаптировать его в TS-React-компонент в `SubscriptionForm.tsx`.
3. Заменить все `<input type="date">` на `<SubDatePicker value={...} onChange={...} />`.
4. Использовать `state.promos` (массив) с `setPromos`, `addPromo`, `updatePromo(i)`, `removePromo(i)` — как в дизайне (см. строки 884-949 и 1542-1607).
5. Trial-блок (строки 1510-1540) — независим от promo.
6. Live summary card (строки 1456-1502) — duration/charges/total.
7. Suggested next charge (строки 1446-1453).
8. Mode toggle «Новая / Уже пользуюсь» (только при !state.sku) — строки 1379-1411.
9. Status select показывается только при `state.sku` (edit).
10. ServicePickerInline (отдельный компонент, см. строки 1066-1162) — вверху формы, только при !state.sku.
11. На submit — `onCreate` или `onUpdate` через `createSubscription`/`updateSubscription` API.
12. Обработка ошибок: 409 / 422 / 404 → баннер.
13. Footer (строки 1610-1620): Удалить (только edit) / Отмена / Сохранить|Создать.

Сохранять существующий dirty-check паттерн (`isDirty` от изменений state).

**Важно — promo input UI:** валюту промо берёт от подписки (тот же `state.currencyId`), показывать справа от поля цены как в дизайне (строки 911-919 — read-only display валюты с символом ₽/$/EUR/Br + iso-код).

- [ ] **Step 3: Скорректировать SubscriptionsPage**

В `SubscriptionsPage.tsx`, в `newInitial`:

```ts
function newInitial(projectSku: string): SubscriptionFormState {
  return {
    mode: 'new',
    projectSku,
    serviceSku: null,
    nameCustom: '',
    iconCustom: null,
    categorySku: '',
    amount: '',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '',
    nextBillingDate: new Date().toISOString().slice(0, 10),
    isTrial: false,
    trialEndsAt: '',
    comment: '',
    promos: [],
  };
}
```

- [ ] **Step 4: Verify в браузере (mandatory — UI feature)**

Run: `yarn dev`. Проверить:
1. Создание подписки — кастомный DatePicker открывается, выбор даты работает, «Сегодня/Очистить».
2. Можно добавить 2+ промо — каждое со своей датой и ценой.
3. Trial чекбокс + промо — оба активны одновременно, оба сохраняются.
4. Live summary показывается при «Уже пользуюсь» + заполненный firstBillingDate.
5. Suggested next — кнопка появляется и подставляет дату.
6. Edit existing — все поля заполнены, статус-селект виден.
7. Submit на API возвращает 200/201 — форма закрывается, список обновляется.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/subscription-form apps/web/src/_pages/subscriptions/ui/SubscriptionsPage.tsx
git commit -m "$(cat <<'EOF'
#85: SubscriptionForm — секции, кастомный DatePicker, multi-promo, live summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Delete-subscription — формулировка «удалить безвозвратно»

**Files:**
- Modify: `apps/web/src/features/delete-subscription/ui/DeleteSubscriptionButton.tsx`

- [ ] **Step 1: Изменить текст confirm**

Заменить description:

```tsx
description={
  error ??
  t(
    `«${name}» будет удалена безвозвратно вместе с историей списаний.`,
    `«${name}» will be permanently deleted along with its billing history.`,
  )
}
```

Заменить title:

```tsx
title={t('Удалить подписку безвозвратно?', 'Permanently delete subscription?')}
```

- [ ] **Step 2: Verify в браузере**

Проверить что текст обновился и при подтверждении подписка физически удаляется (исчезает из всех фильтров, не появляется в «archived» — потому что архив-фильтра больше нет).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/delete-subscription
git commit -m "$(cat <<'EOF'
#85: delete-subscription — формулировка «удалить безвозвратно»

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Обновить ctx и закрыть #44

**Files:**
- Modify: `ai/ctx-business-logic.md`
- Modify: `ai/ctx-architecture.md`

- [ ] **Step 1: ctx-business-logic.md § «Subscription — promo / trial»**

Полностью заменить раздел. Новый текст:

```
### Subscription — trial

Поля: `is_trial bool`, `trial_ends_at timestamptz` (NULL когда не триал).

- `is_trial = true` ⇒ `trial_ends_at NOT NULL`.
- `is_trial = false` ⇒ `trial_ends_at IS NULL`.
- Триал — независимая семантика, не цена. UI рисует плашку «Триал»;
  для расчётов суммы триал не используется (это делают только promo).

### Subscription — promo (multi)

Промо живут в отдельной таблице `subscription_promo`. Подписка может
иметь любое количество промо одновременно (хотя обычно 1-2).

Поля промо: `amount numeric(12,2)`, `ends_at timestamptz`,
`deleted_at`, `version int`.

Валидные значения:
- `0 < amount < subscription.amount`.
- `ends_at > now()` при create (на update — сервис позволяет
  обновлять прошедшие промо, но customer таких случаев не видит).

Resolved current price (для дашборда / списания):
- Активные промо: `deleted_at IS NULL AND ends_at > now()`.
- Если активных нет → `subscription.amount`.
- Если есть → минимальный `amount` среди активных.

UI на странице списка рисует бэдж «ПРОМО» если у подписки есть хотя
бы один активный промо. Форма редактирования показывает все промо
массивом с возможностью добавить/изменить/удалить (replace-all
семантика — backend сравнивает массив с тем что в БД и применяет
diff).
```

И обновить § «Billing history — генерация»:

```
- Resolver текущей цены — `resolveCurrentPrice(subscription.amount,
  active_promos, billed_at)` (см. promo-resolver.ts).
- `is_promo = (resolved.isPromo)`.
```

И § «Billing history — backfill при создании»:

```
- Учитываем промо: для каждого цикла берём `resolveCurrentPrice` в
  момент `period_end` (billed_at). Промо применяется когда активен в
  момент billed_at.
```

И § «Удаление»:

```
- **Subscription** (одиночное удаление через UI) — **hard-delete**:
  DELETE FROM subscription WHERE sku = ?. Каскадом через FK
  удаляются `subscription_promo` и `billing_history`.
  `state_id = ARCHIVED` теперь используется только при cascade
  удаления customer'а (см. ниже).
- **Subscription** (cascade при soft-delete customer'а) — пока
  оставляем как есть (subscriptions переживают customer's grace
  period). Cron 152-ФЗ через 30 дней physically delete customer →
  каскад убирает subscriptions.
- Bulk «Удалить все подписки» — без изменений (hard-delete всего
  customer'а).
- Project — без изменений (hard-delete cascade).
```

- [ ] **Step 2: ctx-architecture.md § «Каждая бизнес-сущность имеет sku»**

Добавить префикс `spm` в список:

```
- Формат: `<prefix>-<8 символов base32-crockford>`. Префикс из 3
  символов: `cus`, `prj`, `sub`, `bil`, `cat`, `cct`, `srv`, `spm`.
```

И в § «Каскады и FK» добавить:

```
- `subscription.id` каскадится на `subscription_promo` и
  `billing_history` через `ON DELETE CASCADE`.
```

И в § «Доменная схема»:

```
customer ─┬─ refresh_token
          ├─ project ─┬─ subscription ─┬─ billing_history
          │           │                 ├─ subscription_promo
          │           │                 └─ (FK на category или category_custom)
          │           └─ category_custom
          └─ (косвенно через project) ─ category_custom
```

- [ ] **Step 3: Commit**

```bash
git add ai/ctx-business-logic.md ai/ctx-architecture.md
git commit -m "$(cat <<'EOF'
#85: ctx — multi-promo, trial независим, hard delete subscription

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Закрыть #44 при merge**

В PR body добавить «Closes #44».

---

## Task 19: Smoke + final verify

**Files:**
- Любые мелкие правки

- [ ] **Step 1: Full typecheck**

Run: `yarn typecheck`
Expected: 0 errors.

- [ ] **Step 2: Full lint**

Run: `yarn lint`
Expected: 0 warnings/errors.

- [ ] **Step 3: All tests**

Run: `yarn workspace @subzero/api test`
Expected: PASS (новые promo-resolver + billing-cycle + service + e2e тесты).

- [ ] **Step 4: Browser golden path**

1. Логин → /account/subscriptions.
2. Создать новую подписку с trial + 2 промо + `firstBillingDate=today` → должна быть подсвечена «Сегодня».
3. Создать ещё одну с `firstBillingDate` 5 дней назад → display next должен сдвинуться вперёд.
4. Открыть редактирование — все три промо видны, можно удалить один и добавить новый.
5. Удалить подписку через кнопку → confirm «удалить безвозвратно» → пропадает физически.
6. Проверить в фильтре «Все статусы» — нет «Архив» больше.

- [ ] **Step 5: Финальный коммит (если что-то добавилось)**

```bash
git status
# если есть незакоммиченное:
git add <files>
git commit -m "..."
```

---

## Self-Review

**1. Spec coverage:**

| Спек | Таск |
|------|------|
| Hard delete subscription | 10 (service), 12 (e2e) |
| nextBillingDate=today → «Сегодня» + view-time recompute | 14 (helper), 15 (list) |
| Подсветка сегодняшних в списке | 15 |
| Multi-promo backend | 2-12 (schema + migration + repo + service + dto + e2e) |
| Multi-promo UI | 16 |
| Custom DatePicker | 13 (component), 16 (use in form) |
| Trial и promo независимы | 5 (DTO), 10 (service validation), 12 (e2e) |
| Дизайн формы (01/02/03 + live summary) | 16 |
| Закрыть #44, обновить ctx | 18 |

Покрытие полное.

**2. Placeholder scan:**

В плане есть `<timestamp_ms>` в Task 4 step 2 — это значение, которое drizzle-kit или сам исполнитель подставит из `Date.now()`. Не плейсхолдер «делай сам что хочешь», а явная инструкция.

`#85` для issue — заменяется при старте работы.

«В Task 16 объём кода большой, ссылаюсь на дизайн-файл» — это не TODO; явная инструкция «прочесть исходник и адаптировать». Step 2 даёт подробный чеклист правок.

**3. Type consistency:**

- `SubscriptionDto.promos: PromoDto[]` — определён в Task 5; используется одинаково в Tasks 9, 10, 11, 16.
- `findServiceBySku` (переименован из `findServiceByCustomSku`) — в Task 9, используется в Task 10.
- `hardDelete` — Task 9 (repo), Task 10 (service), Task 12 (e2e).
- `trialEndsAt: string | null` — единообразно в DTO/types/state.
- SKU префикс `spm` — Task 1, используется в Task 4 (миграция), Task 10 (service generateSku).
- `displayNextBillingDate` — Task 14, используется в Task 15.

Несоответствий не нашёл.
