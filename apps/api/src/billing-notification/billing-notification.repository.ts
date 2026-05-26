import { Inject, Injectable } from '@nestjs/common';
import { CustomerState, SubscriptionState } from '@subzero/shared';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { mailOutbox } from '../db/schema/mail-outbox';
import { project } from '../db/schema/project';
import { service } from '../db/schema/service';
import { subscription } from '../db/schema/subscription';
import { CURRENCY_LABEL } from './currency-label';
import type {
  BillingNotificationRepository,
  UpcomingChargeOutboxRow,
} from './billing-notification.types';

@Injectable()
export class DrizzleBillingNotificationRepository implements BillingNotificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findUpcomingChargeCandidates(today: Date): Promise<UpcomingChargeOutboxRow[]> {
    // SQL-уровневая фильтрация: daysUntil ∈ lead_days. Считаем как разность
    // в днях между date-частями (UTC). lead_days — int[], поэтому ANY().
    const todayIso = today.toISOString().slice(0, 10);
    const rows = await this.db
      .select({
        customerId: customer.id,
        toEmail: customer.email,
        localeId: customer.localeId,
        customerName: customer.name,
        subscriptionSku: subscription.sku,
        nameCustom: subscription.nameCustom,
        serviceName: service.name,
        amount: subscription.amount,
        currencyId: subscription.currencyId,
        nextBillingDate: subscription.nextBillingDate,
        projectName: project.name,
        daysBefore: sql<number>`(date(${subscription.nextBillingDate}) - date(${todayIso}))::int`,
      })
      .from(customer)
      .innerJoin(
        subscription,
        and(
          eq(subscription.customerId, customer.id),
          eq(subscription.stateId, SubscriptionState.ACTIVE),
          isNull(subscription.deletedAt),
        ),
      )
      .innerJoin(project, eq(project.id, subscription.projectId))
      .leftJoin(service, eq(service.id, subscription.serviceId))
      .where(
        and(
          eq(customer.notificationsEnabled, true),
          eq(customer.stateId, CustomerState.ACTIVE),
          isNull(customer.deletedAt),
          sql`(date(${subscription.nextBillingDate}) - date(${todayIso})) = ANY(${customer.notificationLeadDays})`,
        ),
      );

    return rows.map((r) => {
      const billingDate = new Date(r.nextBillingDate).toISOString().slice(0, 10);
      return {
        customerId: r.customerId,
        toEmail: r.toEmail,
        localeId: r.localeId,
        customerName: r.customerName,
        subscriptionSku: r.subscriptionSku,
        serviceName: r.nameCustom ?? r.serviceName ?? r.subscriptionSku,
        amount: r.amount,
        currency: CURRENCY_LABEL[r.currencyId] ?? 'RUB',
        billingDate,
        daysBefore: Number(r.daysBefore),
        projectName: r.projectName,
        dedupKey: `upcoming-charge:${r.subscriptionSku}:${billingDate}:${Number(r.daysBefore)}`,
      };
    });
  }

  async enqueueIdempotent(rows: UpcomingChargeOutboxRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const values = rows.map((r) => ({
      customerId: r.customerId,
      template: 'upcoming-charge',
      localeId: r.localeId,
      toEmail: r.toEmail,
      context: {
        subscriptionPath: `/account/subscriptions/${r.subscriptionSku}`,
        serviceName: r.serviceName,
        amount: r.amount,
        currency: r.currency,
        billingDate: r.billingDate,
        daysBefore: r.daysBefore,
        projectName: r.projectName,
        name: r.customerName ?? undefined,
      },
      dedupKey: r.dedupKey,
    }));
    const res = await this.db
      .insert(mailOutbox)
      .values(values)
      .onConflictDoNothing({ target: mailOutbox.dedupKey });
    // drizzle pg возвращает QueryResult — drizzle-orm не унифицирует rowCount, поэтому
    // полагаемся на длину values (потенциально overcount при конфликте, но в логе ОК).
    return res.rowCount ?? values.length;
  }
}
