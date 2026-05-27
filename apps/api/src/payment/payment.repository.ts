import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { PaymentDto, PaymentListResponse } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { payment } from '../db/schema/payment';
import type { PaymentListArgs, PaymentRepository } from './payment.types';

@Injectable()
export class DrizzlePaymentRepository implements PaymentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(args: PaymentListArgs): Promise<PaymentListResponse> {
    const where = and(eq(payment.customerId, args.customerId), isNull(payment.deletedAt));

    const [{ n }] = await this.db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(payment)
      .where(where);

    const offset = (args.page - 1) * args.pageSize;

    const rows = await this.db
      .select({
        sku: payment.sku,
        paidAt: payment.createdAt,
        paidPlanId: payment.paidPlanId,
        amount: payment.amount,
        currencyId: payment.currencyId,
        statusId: payment.statusId,
      })
      .from(payment)
      .where(where)
      .orderBy(desc(payment.createdAt))
      .limit(args.pageSize)
      .offset(offset);

    const items: PaymentDto[] = rows.map((r) => ({
      sku: r.sku,
      paidAt: r.paidAt.toISOString(),
      paidPlanId: r.paidPlanId,
      amount: r.amount,
      currencyId: r.currencyId,
      statusId: r.statusId,
    }));

    return {
      items,
      total: n ?? 0,
      page: args.page,
      pageSize: args.pageSize,
    };
  }
}
