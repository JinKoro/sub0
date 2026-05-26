import { Inject, Injectable } from '@nestjs/common';
import { and, asc, between, eq, isNull } from 'drizzle-orm';
import type { BillingHistoryEntryDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { billingHistory } from '../db/schema/billing-history';
import { project } from '../db/schema/project';
import { subscription } from '../db/schema/subscription';
import type { BillingHistoryListArgs, BillingHistoryRepository } from './billing-history.types';

@Injectable()
export class DrizzleBillingHistoryRepository implements BillingHistoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(args: BillingHistoryListArgs): Promise<BillingHistoryEntryDto[]> {
    const where = [
      eq(billingHistory.customerId, args.customerId),
      isNull(billingHistory.deletedAt),
      between(billingHistory.billedAt, args.from, args.to),
    ];

    if (args.projectSku) {
      where.push(eq(project.sku, args.projectSku));
    }

    const rows = await this.db
      .select({
        sku: billingHistory.sku,
        subscriptionSku: subscription.sku,
        projectSku: project.sku,
        amount: billingHistory.amount,
        currencyId: billingHistory.currencyId,
        periodStart: billingHistory.periodStart,
        periodEnd: billingHistory.periodEnd,
        billedAt: billingHistory.billedAt,
        isPromo: billingHistory.isPromo,
      })
      .from(billingHistory)
      .innerJoin(subscription, eq(subscription.id, billingHistory.subscriptionId))
      .innerJoin(project, eq(project.id, billingHistory.projectId))
      .where(and(...where))
      .orderBy(asc(billingHistory.billedAt));

    return rows.map((r) => ({
      sku: r.sku,
      subscriptionSku: r.subscriptionSku,
      projectSku: r.projectSku,
      amount: r.amount,
      currencyId: r.currencyId,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      billedAt: r.billedAt.toISOString(),
      isPromo: r.isPromo,
    }));
  }
}
