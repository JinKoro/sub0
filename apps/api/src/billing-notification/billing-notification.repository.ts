import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerState,
  NotificationChannelType,
  NotificationEvent,
  SubscriptionState,
} from '@subzero/shared';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { mailOutbox } from '../db/schema/mail-outbox';
import { notificationChannel } from '../db/schema/notification-channel';
import { notificationEventPreference } from '../db/schema/notification-event-preference';
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
    // SQL-уровневая фильтрация:
    //  - LEFT JOIN preferences для UPCOMING_CHARGE; COALESCE с дефолтами,
    //    чтобы customer без явной записи всё равно получал письма
    //    (дефолт: enabled=true, channels=[EMAIL], daysBefore=[3]).
    //  - EMAIL обязательно в channel_type_ids: TG/MAX пока пропускаем.
    //  - INNER JOIN на активный EMAIL-канал (enabled AND verified_at NOT
    //    NULL) — единственный «активный» канал в MVP. Адрес письма берём
    //    из канала. Backfill (#45) завёл EMAIL-канал всем active-customer.
    //  - quiet_hours: если now() в локальной TZ юзера попадает в окно
    //    [from..to] — пропускаем (next tick подберёт).
    const todayIso = today.toISOString().slice(0, 10);
    const localTimeSql = sql<string>`((now() AT TIME ZONE ${customer.timezone})::time)::text`;
    const quietHoursBlocked = sql`(
      ${customer.quietHoursEnabled} = true
      AND ${customer.quietHoursFrom} IS NOT NULL
      AND ${customer.quietHoursTo} IS NOT NULL
      AND (
        CASE
          WHEN ${customer.quietHoursFrom} <= ${customer.quietHoursTo}
            THEN (${localTimeSql})::time >= ${customer.quietHoursFrom}
                AND (${localTimeSql})::time < ${customer.quietHoursTo}
          ELSE (${localTimeSql})::time >= ${customer.quietHoursFrom}
            OR (${localTimeSql})::time < ${customer.quietHoursTo}
        END
      )
    )`;

    const rows = await this.db
      .select({
        customerId: customer.id,
        toEmail: notificationChannel.address,
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
      .leftJoin(
        notificationEventPreference,
        and(
          eq(notificationEventPreference.customerId, customer.id),
          eq(notificationEventPreference.eventId, NotificationEvent.UPCOMING_CHARGE),
        ),
      )
      .innerJoin(
        notificationChannel,
        and(
          eq(notificationChannel.customerId, customer.id),
          eq(notificationChannel.typeId, NotificationChannelType.EMAIL),
          eq(notificationChannel.enabled, true),
          sql`${notificationChannel.verifiedAt} IS NOT NULL`,
        ),
      )
      .where(
        and(
          eq(customer.stateId, CustomerState.ACTIVE),
          isNull(customer.deletedAt),
          sql`COALESCE(${notificationEventPreference.enabled}, true) = true`,
          sql`${NotificationChannelType.EMAIL} = ANY(COALESCE(${notificationEventPreference.channelTypeIds}, ARRAY[${NotificationChannelType.EMAIL}]::int[]))`,
          sql`(date(${subscription.nextBillingDate}) - date(${todayIso})) = ANY(COALESCE(${notificationEventPreference.daysBefore}, ARRAY[3]::int[]))`,
          sql`NOT ${quietHoursBlocked}`,
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
    return res.rowCount ?? values.length;
  }
}
