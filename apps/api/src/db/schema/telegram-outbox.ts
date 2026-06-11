import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { customer } from './customer';

/** Outbox доставки нотификаций в Telegram (#111). Зеркалит `mail_outbox`,
 *  но адресат — `chat_id` (verified TG-канал), а не email. Воркер берёт
 *  pending-строки и шлёт через Bot API. Идемпотентность планировщика —
 *  через unique(dedup_key), как в mail_outbox. */
export const telegramOutbox = pgTable(
  'telegram_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customer.id, { onDelete: 'cascade' }),
    template: varchar('template', { length: 64 }).notNull(),
    localeId: integer('locale_id').notNull(),
    // Telegram chat id verified-канала. Храним строкой (id бывают большими).
    chatId: varchar('chat_id', { length: 64 }).notNull(),
    context: jsonb('context').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    retries: integer('retries').notNull().default(0),
    // 'upcoming-charge:{subSku}:{billingDate}:{daysBefore}' — тот же ключ,
    // что у email, но отдельная таблица → коллизий между каналами нет.
    dedupKey: varchar('dedup_key', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_telegram_outbox_pending')
      .on(t.createdAt)
      .where(sql`${t.sentAt} IS NULL AND ${t.failedAt} IS NULL`),
    index('idx_telegram_outbox_customer')
      .on(t.customerId)
      .where(sql`${t.customerId} IS NOT NULL`),
    uniqueIndex('telegram_outbox_dedup_key_uidx').on(t.dedupKey),
  ],
);

export type TelegramOutboxEntry = typeof telegramOutbox.$inferSelect;
export type NewTelegramOutboxEntry = typeof telegramOutbox.$inferInsert;
