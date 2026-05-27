import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const payment = pgTable(
  'payment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    providerId: integer('provider_id').notNull(),
    // Идентификатор транзакции у провайдера: текст, потому что у разных
    // эквайеров разные форматы. Идемпотентность вебхуков — UNIQUE-индекс
    // ниже.
    providerPaymentId: text('provider_payment_id').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currencyId: integer('currency_id').notNull(),
    statusId: integer('status_id').notNull(),
    paidPlanId: integer('paid_plan_id').notNull(),
    // До какой даты оплачен тариф: customer.plan_expires_at синхронизируется
    // отсюда. Хранится отдельно, чтобы при возврате/споре было видно
    // фактический интервал, а не только текущее состояние customer'а.
    paidUntil: timestamp('paid_until', { withTimezone: true }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('payment_sku_key').on(t.sku),
    // Идемпотентность вебхуков: повторный callback провайдера не создаёт дубль.
    uniqueIndex('payment_provider_payment_key').on(t.providerId, t.providerPaymentId),
    index('idx_payment_customer')
      .on(t.customerId)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_payment_paid_until')
      .on(t.customerId, t.paidUntil)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
