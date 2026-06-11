import { Inject, Injectable } from '@nestjs/common';
import { NotificationChannelType } from '@subzero/shared';
import { and, eq, gt, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { notificationChannel } from '../db/schema/notification-channel';

export interface VerifiedChannel {
  customerId: string;
  localeId: number;
}

export interface TelegramRepository {
  /** Атомарно верифицирует TG-канал по одноразовому nonce: выставляет
   *  `address = chatId`, `verified_at = now()`, гасит nonce. Идемпотентно —
   *  истёкший / уже погашенный nonce строк не находит и возвращает null. */
  verifyByNonce(nonce: string, chatId: string): Promise<VerifiedChannel | null>;
}

@Injectable()
export class DrizzleTelegramRepository implements TelegramRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async verifyByNonce(nonce: string, chatId: string): Promise<VerifiedChannel | null> {
    const [row] = await this.db
      .update(notificationChannel)
      .set({
        address: chatId,
        verifiedAt: sql`now()`,
        connectNonce: null,
        connectNonceExpiresAt: null,
        version: sql`${notificationChannel.version} + 1`,
      })
      .where(
        and(
          eq(notificationChannel.typeId, NotificationChannelType.TELEGRAM),
          eq(notificationChannel.connectNonce, nonce),
          gt(notificationChannel.connectNonceExpiresAt, sql`now()`),
        ),
      )
      .returning({ customerId: notificationChannel.customerId });

    if (!row) return null;

    const [c] = await this.db
      .select({ localeId: customer.localeId })
      .from(customer)
      .where(eq(customer.id, row.customerId))
      .limit(1);

    return { customerId: row.customerId, localeId: c?.localeId ?? 1 };
  }
}
