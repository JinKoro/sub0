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
import { project } from '../db/schema/project';
import { service } from '../db/schema/service';
import { subscription } from '../db/schema/subscription';
import type { SubscriptionRepository } from './subscription.types';

const STATE_MAP: Record<SubscriptionListStatus, number[]> = {
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

    const where: SQL[] = [eq(subscription.customerId, customerId)];
    const states = q.status ? STATE_MAP[q.status] : DEFAULT_NON_ARCHIVED;
    // ARCHIVED идёт рука об руку с soft-delete (см. ctx-business-logic.md):
    // включать deleted-rows только если фильтр явно их запрашивает.
    if (q.status === 'archived' || q.status === 'all') {
      // archived → deleted_at IS NOT NULL и stateId=ARCHIVED;
      // all → без фильтра по deletedAt (вернёт и активные, и архив).
    } else {
      where.push(isNull(subscription.deletedAt));
    }
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
      .leftJoin(categoryCustom, eq(subscription.categoryCustomId, categoryCustom.id))
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

  // IMPORTANT: This in-transaction lookup uses the same `select` shape as findBySku,
  // so changes there must be reflected here. Kept as a private method to avoid
  // recursion via `this.db` while still inside the open transaction.
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
