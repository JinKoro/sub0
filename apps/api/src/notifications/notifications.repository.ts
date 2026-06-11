import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
  NotificationChannelDto,
  NotificationPreferenceDto,
  QuietHoursDto,
} from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { notificationChannel } from '../db/schema/notification-channel';
import { notificationEventPreference } from '../db/schema/notification-event-preference';
import type {
  ChannelUpsert,
  NotificationsRepository,
  QuietHoursUpsert,
} from './notifications.types';

function toChannelDto(row: {
  typeId: number;
  address: string;
  enabled: boolean;
  verifiedAt: Date | null;
}): NotificationChannelDto {
  return {
    typeId: row.typeId,
    // Pending TG/MAX хранят '' — отдаём клиенту как null.
    address: row.address === '' ? null : row.address,
    enabled: row.enabled,
    verified: row.verifiedAt !== null,
  };
}

@Injectable()
export class DrizzleNotificationsRepository implements NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listChannels(customerId: string): Promise<NotificationChannelDto[]> {
    const rows = await this.db
      .select({
        typeId: notificationChannel.typeId,
        address: notificationChannel.address,
        enabled: notificationChannel.enabled,
        verifiedAt: notificationChannel.verifiedAt,
      })
      .from(notificationChannel)
      .where(eq(notificationChannel.customerId, customerId));
    return rows.map(toChannelDto);
  }

  async getCustomerEmail(customerId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ email: customer.email })
      .from(customer)
      .where(and(eq(customer.id, customerId), isNull(customer.deletedAt)))
      .limit(1);
    return row?.email ?? null;
  }

  async upsertChannel(customerId: string, args: ChannelUpsert): Promise<NotificationChannelDto> {
    const [row] = await this.db
      .insert(notificationChannel)
      .values({
        customerId,
        typeId: args.typeId,
        address: args.address,
        enabled: args.enabled,
        verifiedAt: args.verifiedAt,
        connectNonce: args.connectNonce,
        connectNonceExpiresAt: args.connectNonceExpiresAt,
      })
      .onConflictDoUpdate({
        target: [notificationChannel.customerId, notificationChannel.typeId],
        set: {
          address: sql`excluded.address`,
          enabled: sql`excluded.enabled`,
          verifiedAt: sql`excluded.verified_at`,
          connectNonce: sql`excluded.connect_nonce`,
          connectNonceExpiresAt: sql`excluded.connect_nonce_expires_at`,
          version: sql`${notificationChannel.version} + 1`,
        },
      })
      .returning({
        typeId: notificationChannel.typeId,
        address: notificationChannel.address,
        enabled: notificationChannel.enabled,
        verifiedAt: notificationChannel.verifiedAt,
      });
    return toChannelDto(row);
  }

  async deleteChannel(customerId: string, typeId: number): Promise<boolean> {
    const res = await this.db
      .delete(notificationChannel)
      .where(
        and(
          eq(notificationChannel.customerId, customerId),
          eq(notificationChannel.typeId, typeId),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }

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
