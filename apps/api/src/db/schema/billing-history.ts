import { sql } from 'drizzle-orm';
import { boolean, index, integer, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { customer } from './customer';
import { project } from './project';
import { subscription } from './subscription';

export const billingHistory = pgTable(
  'billing_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscription.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currencyId: integer('currency_id').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    billedAt: timestamp('billed_at', { withTimezone: true }).notNull(),
    isPromo: boolean('is_promo').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('billing_history_sku_key').on(t.sku),
    index('idx_billing_history_subscription_billed')
      .on(t.subscriptionId, t.billedAt)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_billing_history_customer_billed')
      .on(t.customerId, t.billedAt)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_billing_history_project_billed')
      .on(t.projectId, t.billedAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type BillingHistoryEntry = typeof billingHistory.$inferSelect;
export type NewBillingHistoryEntry = typeof billingHistory.$inferInsert;
