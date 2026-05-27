import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
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
  type SubscriptionListStatus,
} from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { billingHistory } from '../db/schema/billing-history';
import { category } from '../db/schema/category';
import { categoryCustom } from '../db/schema/category-custom';
import { customer } from '../db/schema/customer';
import { project } from '../db/schema/project';
import { service } from '../db/schema/service';
import { subscription } from '../db/schema/subscription';
import { subscriptionPromo } from '../db/schema/subscription-promo';
import type { SubscriptionRepository } from './subscription.types';

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

const DEFAULT_NON_ARCHIVED = [
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
];

interface SubscriptionRow {
  id: string;
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  serviceName: string | null;
  serviceIcon: string | null;
  nameCustom: string | null;
  iconCustom: string | null;
  color: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  firstBillingDate: Date;
  nextBillingDate: Date;
  isTrial: boolean;
  trialEndsAt: Date | null;
  comment: string | null;
  stateId: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

function toDto(row: SubscriptionRow, promos: SubscriptionDto['promos']): SubscriptionDto {
  return {
    sku: row.sku,
    projectSku: row.projectSku,
    serviceSku: row.serviceSku,
    name: row.nameCustom ?? row.serviceName ?? '',
    icon: row.iconCustom ?? row.serviceIcon ?? null,
    color: row.color,
    categorySku: row.categorySku,
    categoryCustomSku: row.categoryCustomSku,
    amount: row.amount,
    currencyId: row.currencyId,
    billingPeriodId: row.billingPeriodId,
    firstBillingDate: row.firstBillingDate.toISOString(),
    nextBillingDate: row.nextBillingDate.toISOString(),
    isTrial: row.isTrial,
    trialEndsAt: row.trialEndsAt ? row.trialEndsAt.toISOString() : null,
    comment: row.comment,
    stateId: row.stateId,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    promos,
  };
}

const SUBSCRIPTION_SELECT = {
  id: subscription.id,
  sku: subscription.sku,
  projectSku: project.sku,
  serviceSku: service.sku,
  serviceName: service.name,
  serviceIcon: service.icon,
  nameCustom: subscription.nameCustom,
  iconCustom: subscription.iconCustom,
  color: subscription.color,
  categorySku: category.sku,
  categoryCustomSku: categoryCustom.sku,
  amount: subscription.amount,
  currencyId: subscription.currencyId,
  billingPeriodId: subscription.billingPeriodId,
  firstBillingDate: subscription.firstBillingDate,
  nextBillingDate: subscription.nextBillingDate,
  isTrial: subscription.isTrial,
  trialEndsAt: subscription.trialEndsAt,
  comment: subscription.comment,
  stateId: subscription.stateId,
  version: subscription.version,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
} as const;

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

  async findServiceBySku(sku: string) {
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
    return row ?? null;
  }

  async findCategoryIdBySku(sku: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.sku, sku))
      .limit(1);
    return row?.id ?? null;
  }

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

  async findCustomerPlanId(customerId: string): Promise<number | null> {
    const [row] = await this.db
      .select({ planId: customer.planId })
      .from(customer)
      .where(and(eq(customer.id, customerId), isNull(customer.deletedAt)))
      .limit(1);
    return row?.planId ?? null;
  }

  async countActiveForCustomer(customerId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(subscription)
      .where(
        and(
          eq(subscription.customerId, customerId),
          inArray(subscription.stateId, DEFAULT_NON_ARCHIVED),
          isNull(subscription.deletedAt),
        ),
      );
    return Number(row?.n ?? 0);
  }

  async list(
    customerId: string,
    q: SubscriptionListQuery,
  ): Promise<SubscriptionListResponse> {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const where: SQL[] = [
      eq(subscription.customerId, customerId),
      isNull(subscription.deletedAt),
    ];
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
      .select(SUBSCRIPTION_SELECT)
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
      .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
      .where(whereExpr);

    // Промо для списка — пустой массив для производительности; UI на странице
    // списка не показывает promo-badge. Полные промо доступны через findBySku.
    const items = rows.map((r) => toDto(r as SubscriptionRow, []));

    return { items, total: count, page, pageSize };
  }

  async findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null> {
    const [row] = await this.db
      .select(SUBSCRIPTION_SELECT)
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
    if (!row) return null;
    const promoRows = await this.db
      .select({
        sku: subscriptionPromo.sku,
        amount: subscriptionPromo.amount,
        endsAt: subscriptionPromo.endsAt,
        version: subscriptionPromo.version,
      })
      .from(subscriptionPromo)
      .where(
        and(
          eq(subscriptionPromo.subscriptionId, row.id),
          isNull(subscriptionPromo.deletedAt),
        ),
      )
      .orderBy(asc(subscriptionPromo.endsAt));
    const promos = promoRows.map((p) => ({
      sku: p.sku,
      amount: p.amount,
      endsAt: p.endsAt.toISOString(),
      version: p.version,
    }));
    return toDto(row as SubscriptionRow, promos);
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
          color: args.color,
          amount: args.amount,
          currencyId: args.currencyId,
          billingPeriodId: args.billingPeriodId,
          firstBillingDate: args.firstBillingDate,
          nextBillingDate: args.nextBillingDate,
          isTrial: args.isTrial,
          trialEndsAt: args.trialEndsAt,
          comment: args.comment,
        })
        .returning({ id: subscription.id });

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

      // Read back inside the same tx so callers see the freshly-committed row.
      const [row] = await tx
        .select(SUBSCRIPTION_SELECT)
        .from(subscription)
        .innerJoin(project, eq(subscription.projectId, project.id))
        .leftJoin(service, eq(subscription.serviceId, service.id))
        .leftJoin(category, eq(subscription.categoryId, category.id))
        .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
        .where(eq(subscription.id, inserted.id))
        .limit(1);
      if (!row) throw new Error('subscription disappeared after insert');

      const promoRows = await tx
        .select({
          sku: subscriptionPromo.sku,
          amount: subscriptionPromo.amount,
          endsAt: subscriptionPromo.endsAt,
          version: subscriptionPromo.version,
        })
        .from(subscriptionPromo)
        .where(
          and(
            eq(subscriptionPromo.subscriptionId, inserted.id),
            isNull(subscriptionPromo.deletedAt),
          ),
        )
        .orderBy(asc(subscriptionPromo.endsAt));
      const promos = promoRows.map((p) => ({
        sku: p.sku,
        amount: p.amount,
        endsAt: p.endsAt.toISOString(),
        version: p.version,
      }));
      return toDto(row as SubscriptionRow, promos);
    });
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
}
