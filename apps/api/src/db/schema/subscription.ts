import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';
import { sql } from 'drizzle-orm';
import { boolean, index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { category } from './category';
import { categoryCustom } from './category-custom';
import { customer } from './customer';
import { project } from './project';
import { service } from './service';

export const subscription = pgTable(
  'subscription',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').references(() => service.id),
    categoryId: uuid('category_id').references(() => category.id),
    categoryCustomId: uuid('category_custom_id').references(() => categoryCustom.id),
    nameCustom: varchar('name_custom', { length: 255 }),
    iconCustom: text('icon_custom'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currencyId: integer('currency_id').notNull().default(Currency.RUB),
    billingPeriodId: integer('billing_period_id').notNull().default(BillingPeriod.MONTH),
    firstBillingDate: timestamp('first_billing_date', { withTimezone: true }).notNull(),
    nextBillingDate: timestamp('next_billing_date', { withTimezone: true }).notNull(),
    isTrial: boolean('is_trial').notNull().default(false),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    promoAmount: numeric('promo_amount', { precision: 12, scale: 2 }),
    promoEndsAt: timestamp('promo_ends_at', { withTimezone: true }),
    comment: varchar('comment', { length: 255 }),
    stateId: integer('state_id').notNull().default(SubscriptionState.ACTIVE),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('subscription_sku_key').on(t.sku),
    index('idx_subscription_customer_project_state')
      .on(t.customerId, t.projectId, t.stateId)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_subscription_next_billing')
      .on(t.customerId, t.nextBillingDate)
      .where(sql`${t.deletedAt} IS NULL AND ${t.stateId} = ${sql.raw(String(SubscriptionState.ACTIVE))}`),
    index('idx_subscription_promo_ends')
      .on(t.customerId, t.promoEndsAt)
      .where(sql`${t.promoEndsAt} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    index('idx_subscription_service')
      .on(t.serviceId)
      .where(sql`${t.serviceId} IS NOT NULL AND ${t.deletedAt} IS NULL`),
  ],
);

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
