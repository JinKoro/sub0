import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const mailOutbox = pgTable(
  'mail_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NULL — системные письма без привязки к customer'у.
    customerId: uuid('customer_id').references(() => customer.id, { onDelete: 'cascade' }),
    template: varchar('template', { length: 64 }).notNull(),
    localeId: integer('locale_id').notNull(),
    toEmail: varchar('to_email', { length: 320 }).notNull(),
    context: jsonb('context').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    retries: integer('retries').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_mail_outbox_pending')
      .on(t.createdAt)
      .where(sql`${t.sentAt} IS NULL AND ${t.failedAt} IS NULL`),
    index('idx_mail_outbox_customer')
      .on(t.customerId)
      .where(sql`${t.customerId} IS NOT NULL`),
  ],
);

export type MailOutboxEntry = typeof mailOutbox.$inferSelect;
export type NewMailOutboxEntry = typeof mailOutbox.$inferInsert;
