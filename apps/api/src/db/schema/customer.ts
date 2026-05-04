import { Currency, CustomerState, Locale, Plan } from '@subzero/shared';
import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const customer = pgTable(
  'customer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: text('password_hash'),
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    timezone: varchar('timezone', { length: 64 }).notNull(),
    localeId: integer('locale_id').notNull().default(Locale.RU),
    currencyId: integer('currency_id').notNull().default(Currency.RUB),
    planId: integer('plan_id').notNull().default(Plan.FREE),
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
    stateId: integer('state_id').notNull().default(CustomerState.CREATED),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('customer_email_key')
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;
