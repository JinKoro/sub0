import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { PaymentDto, PaymentListResponse } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { payment } from '../db/schema/payment';
import type {
  CustomerPlanState,
  PaymentListArgs,
  PaymentRepository,
  UpgradeArgs,
} from './payment.types';

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

  async findCustomerPlanState(customerId: string): Promise<CustomerPlanState | null> {
    const [row] = await this.db
      .select({ planId: customer.planId, planExpiresAt: customer.planExpiresAt })
      .from(customer)
      .where(and(eq(customer.id, customerId), isNull(customer.deletedAt)))
      .limit(1);
    if (!row) return null;
    return { planId: row.planId, planExpiresAt: row.planExpiresAt };
  }

  async upgrade(args: UpgradeArgs): Promise<PaymentDto> {
    return this.db.transaction(async (tx) => {
      const [paymentRow] = await tx
        .insert(payment)
        .values({
          sku: args.paymentSku,
          customerId: args.customerId,
          providerId: args.providerId,
          providerPaymentId: args.providerPaymentId,
          amount: args.amount,
          currencyId: args.currencyId,
          statusId: args.statusId,
          paidPlanId: args.paidPlanId,
          paidUntil: args.paidUntil,
        })
        .returning({
          sku: payment.sku,
          paidAt: payment.createdAt,
          paidPlanId: payment.paidPlanId,
          amount: payment.amount,
          currencyId: payment.currencyId,
          statusId: payment.statusId,
        });

      await tx
        .update(customer)
        .set({
          planId: args.newPlanId,
          planExpiresAt: args.paidUntil,
          version: sql`${customer.version} + 1`,
        })
        .where(eq(customer.id, args.customerId));

      return {
        sku: paymentRow.sku,
        paidAt: paymentRow.paidAt.toISOString(),
        paidPlanId: paymentRow.paidPlanId,
        amount: paymentRow.amount,
        currencyId: paymentRow.currencyId,
        statusId: paymentRow.statusId,
      };
    });
  }
}
