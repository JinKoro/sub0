import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const verificationToken = pgTable(
  'verification_token',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    typeId: integer('type_id').notNull(),
    // Для смены email — { newEmail }. Для EMAIL_VERIFY при регистрации — NULL.
    payload: jsonb('payload').$type<{ newEmail: string }>(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('verification_token_hash_key').on(t.tokenHash),
    index('idx_verification_token_customer_type')
      .on(t.customerId, t.typeId)
      .where(sql`${t.usedAt} IS NULL`),
  ],
);

export type VerificationToken = typeof verificationToken.$inferSelect;
export type NewVerificationToken = typeof verificationToken.$inferInsert;
