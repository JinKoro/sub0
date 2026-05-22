import { sql } from 'drizzle-orm';
import { index, integer, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { subscription } from './subscription';

export const subscriptionPromo = pgTable(
  'subscription_promo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscription.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('subscription_promo_sku_key').on(t.sku),
    index('idx_subscription_promo_sub_active')
      .on(t.subscriptionId, t.endsAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type SubscriptionPromo = typeof subscriptionPromo.$inferSelect;
export type NewSubscriptionPromo = typeof subscriptionPromo.$inferInsert;
