import { Inject, Injectable } from '@nestjs/common';
import { and, asc, isNull, lt, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { mailOutbox } from '../db/schema/mail-outbox';
import type { MailContext } from './mail-templates';
import type { MailOutboxRepository, MailOutboxRow } from './mail.types';

// Stable key for pg_try_advisory_lock — only the mail-outbox worker uses it.
const LOCK_KEY = 64064;

@Injectable()
export class DrizzleMailOutboxRepository implements MailOutboxRepository {
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

  async listPending(limit: number): Promise<MailOutboxRow[]> {
    const rows = await this.db
      .select({
        id: mailOutbox.id,
        template: mailOutbox.template,
        localeId: mailOutbox.localeId,
        toEmail: mailOutbox.toEmail,
        context: mailOutbox.context,
      })
      .from(mailOutbox)
      .where(and(isNull(mailOutbox.sentAt), isNull(mailOutbox.failedAt)))
      .orderBy(asc(mailOutbox.createdAt))
      .limit(limit);
    return rows.map((r) => ({ ...r, context: r.context as MailContext }));
  }

  async markSent(id: string): Promise<void> {
    await this.db
      .update(mailOutbox)
      .set({ sentAt: new Date() })
      .where(sql`${mailOutbox.id} = ${id}`);
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.db
      .update(mailOutbox)
      .set({
        failedAt: new Date(),
        failureReason: reason.slice(0, 1000),
        retries: sql`${mailOutbox.retries} + 1`,
      })
      .where(sql`${mailOutbox.id} = ${id}`);
  }

  async deleteSentBefore(date: Date): Promise<void> {
    await this.db
      .delete(mailOutbox)
      .where(and(sql`${mailOutbox.sentAt} is not null`, lt(mailOutbox.sentAt, date)));
  }
}
