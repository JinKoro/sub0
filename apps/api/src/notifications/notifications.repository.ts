import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { NotificationPreferenceDto, QuietHoursDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { notificationEventPreference } from '../db/schema/notification-event-preference';
import type {
  NotificationsRepository,
  QuietHoursUpsert,
} from './notifications.types';

@Injectable()
export class DrizzleNotificationsRepository implements NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listPreferences(customerId: string): Promise<NotificationPreferenceDto[]> {
    const rows = await this.db
      .select({
        eventId: notificationEventPreference.eventId,
        enabled: notificationEventPreference.enabled,
        channelTypeIds: notificationEventPreference.channelTypeIds,
        daysBefore: notificationEventPreference.daysBefore,
      })
      .from(notificationEventPreference)
      .where(eq(notificationEventPreference.customerId, customerId));
    return rows.map((r) => ({
      eventId: r.eventId,
      enabled: r.enabled,
      channelTypeIds: r.channelTypeIds,
      daysBefore: r.daysBefore,
    }));
  }

  async readQuietHours(
    customerId: string,
  ): Promise<{ data: QuietHoursDto; version: number } | null> {
    const [row] = await this.db
      .select({
        quietHoursEnabled: customer.quietHoursEnabled,
        quietHoursFrom: customer.quietHoursFrom,
        quietHoursTo: customer.quietHoursTo,
        version: customer.version,
      })
      .from(customer)
      .where(and(eq(customer.id, customerId), isNull(customer.deletedAt)))
      .limit(1);
    if (!row) return null;
    return {
      data: {
        enabled: row.quietHoursEnabled,
        // Drizzle отдаёт `time` как 'HH:MM:SS'. UI работает с 'HH:MM' —
        // секунды у нас всегда нули, отрезаем.
        from: row.quietHoursFrom ? row.quietHoursFrom.slice(0, 5) : null,
        to: row.quietHoursTo ? row.quietHoursTo.slice(0, 5) : null,
      },
      version: row.version,
    };
  }

  async upsertPreferences(
    customerId: string,
    items: Array<{
      eventId: number;
      enabled: boolean;
      channelTypeIds: number[];
      daysBefore: number[];
    }>,
  ): Promise<void> {
    if (items.length === 0) return;
    const values = items.map((it) => ({
      customerId,
      eventId: it.eventId,
      enabled: it.enabled,
      channelTypeIds: it.channelTypeIds,
      daysBefore: it.daysBefore,
    }));
    // ON CONFLICT (customer_id, event_id) — unique-index гарантирован
    // миграцией. version + 1 на каждом апдейте.
    await this.db
      .insert(notificationEventPreference)
      .values(values)
      .onConflictDoUpdate({
        target: [notificationEventPreference.customerId, notificationEventPreference.eventId],
        set: {
          enabled: sql`excluded.enabled`,
          channelTypeIds: sql`excluded.channel_type_ids`,
          daysBefore: sql`excluded.days_before`,
          version: sql`${notificationEventPreference.version} + 1`,
        },
      });
  }

  async updateQuietHours(customerId: string, args: QuietHoursUpsert): Promise<boolean> {
    const res = await this.db
      .update(customer)
      .set({
        quietHoursEnabled: args.enabled,
        quietHoursFrom: args.from,
        quietHoursTo: args.to,
        version: sql`${customer.version} + 1`,
      })
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.version, args.version),
          isNull(customer.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }
}
