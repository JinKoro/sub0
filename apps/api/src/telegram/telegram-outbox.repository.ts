import { Inject, Injectable } from '@nestjs/common';
import { and, asc, isNull, lt, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { telegramOutbox } from '../db/schema/telegram-outbox';
import type { UpcomingChargeTelegramContext } from './telegram-templates';
import type { TelegramOutboxRepository, TelegramOutboxRow } from './telegram-outbox.types';

// Стабильный ключ advisory-lock — только telegram-outbox воркер (≠ mail 64064).
const LOCK_KEY = 64065;

@Injectable()
export class DrizzleTelegramOutboxRepository implements TelegramOutboxRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async tryLock(): Promise<boolean> {
    const res = await this.db.execute<{ locked: boolean }>(
      sql`select pg_try_advisory_lock(${LOCK_KEY}) as locked`,
    );
    return res.rows[0]?.locked === true;
  }

  async unlock(): Promise<void> {
    await this.db.execute(sql`select pg_advisory_unlock(${LOCK_KEY})`);
  }

  async listPending(limit: number): Promise<TelegramOutboxRow[]> {
    const rows = await this.db
      .select({
        id: telegramOutbox.id,
        template: telegramOutbox.template,
        localeId: telegramOutbox.localeId,
        chatId: telegramOutbox.chatId,
        context: telegramOutbox.context,
      })
      .from(telegramOutbox)
      .where(and(isNull(telegramOutbox.sentAt), isNull(telegramOutbox.failedAt)))
      .orderBy(asc(telegramOutbox.createdAt))
      .limit(limit);
    return rows.map((r) => ({ ...r, context: r.context as UpcomingChargeTelegramContext }));
  }

  async markSent(id: string): Promise<void> {
    await this.db
      .update(telegramOutbox)
      .set({ sentAt: new Date() })
      .where(sql`${telegramOutbox.id} = ${id}`);
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.db
      .update(telegramOutbox)
      .set({
        failedAt: new Date(),
        failureReason: reason.slice(0, 1000),
        retries: sql`${telegramOutbox.retries} + 1`,
      })
      .where(sql`${telegramOutbox.id} = ${id}`);
  }

  async deleteSentBefore(date: Date): Promise<void> {
    await this.db
      .delete(telegramOutbox)
      .where(and(sql`${telegramOutbox.sentAt} is not null`, lt(telegramOutbox.sentAt, date)));
  }
}
