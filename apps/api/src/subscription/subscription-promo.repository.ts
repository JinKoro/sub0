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
