import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNull, lte, sql } from 'drizzle-orm';
import { SubscriptionState } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { billingHistory } from '../db/schema/billing-history';
import { subscription } from '../db/schema/subscription';
import { subscriptionPromo } from '../db/schema/subscription-promo';
import type {
  DueSubscription,
  SubscriptionCycleRepository,
  TickActiveArgs,
  TickCancelledArgs,
} from './subscription-cycle.types';

const DUE_STATES = [SubscriptionState.ACTIVE, SubscriptionState.CANCELLED];

@Injectable()
export class DrizzleSubscriptionCycleRepository implements SubscriptionCycleRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findDue(now: Date, limit: number): Promise<DueSubscription[]> {
    const dueRows = await this.db
      .select({
        id: subscription.id,
        customerId: subscription.customerId,
        projectId: subscription.projectId,
        amount: subscription.amount,
        currencyId: subscription.currencyId,
        billingPeriodId: subscription.billingPeriodId,
        nextBillingDate: subscription.nextBillingDate,
        stateId: subscription.stateId,
        version: subscription.version,
      })
      .from(subscription)
      .where(
        and(
          isNull(subscription.deletedAt),
          inArray(subscription.stateId, DUE_STATES),
          lte(subscription.nextBillingDate, now),
        ),
      )
      .orderBy(asc(subscription.nextBillingDate))
      .limit(limit);

    if (dueRows.length === 0) return [];

    const ids = dueRows.map((r) => r.id);
    // Активные промо: ends_at > now, не soft-deleted. Один query на батч.
    const promoRows = await this.db
      .select({
        subscriptionId: subscriptionPromo.subscriptionId,
        amount: subscriptionPromo.amount,
        endsAt: subscriptionPromo.endsAt,
      })
      .from(subscriptionPromo)
      .where(
        and(
          inArray(subscriptionPromo.subscriptionId, ids),
          isNull(subscriptionPromo.deletedAt),
          gt(subscriptionPromo.endsAt, now),
        ),
      );

    const promoBySub = new Map<string, Array<{ amount: string; endsAt: Date }>>();
    for (const p of promoRows) {
      const list = promoBySub.get(p.subscriptionId) ?? [];
      list.push({ amount: p.amount, endsAt: p.endsAt });
      promoBySub.set(p.subscriptionId, list);
    }

    return dueRows.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      projectId: r.projectId,
      amount: r.amount,
      currencyId: r.currencyId,
      billingPeriodId: r.billingPeriodId,
      nextBillingDate: r.nextBillingDate,
      stateId: r.stateId,
      version: r.version,
      promos: promoBySub.get(r.id) ?? [],
    }));
  }

  async tickActive(args: TickActiveArgs): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      // Optimistic lock: если version устарел, второй воркер уже обработал
      // эту подписку — откатываемся.
      const res = await tx
        .update(subscription)
        .set({
          nextBillingDate: args.newNextBillingDate,
          version: sql`${subscription.version} + 1`,
        })
        .where(
          and(eq(subscription.id, args.subscriptionId), eq(subscription.version, args.version)),
        );

      if ((res.rowCount ?? 0) === 0) return false;

      await tx.insert(billingHistory).values({
        sku: args.billing.sku,
        subscriptionId: args.subscriptionId,
        customerId: args.customerId,
        projectId: args.projectId,
        amount: args.billing.amount,
        currencyId: args.billing.currencyId,
        periodStart: args.billing.periodStart,
        periodEnd: args.billing.periodEnd,
        billedAt: args.billing.billedAt,
        isPromo: args.billing.isPromo,
      });

      return true;
    });
  }

  async tickCancelled(args: TickCancelledArgs): Promise<boolean> {
    const res = await this.db
      .update(subscription)
      .set({
        stateId: SubscriptionState.ARCHIVED,
        version: sql`${subscription.version} + 1`,
      })
      .where(
        and(eq(subscription.id, args.subscriptionId), eq(subscription.version, args.version)),
      );
    return (res.rowCount ?? 0) > 0;
  }
}
