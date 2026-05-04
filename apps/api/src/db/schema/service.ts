import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { category } from './category';

export const service = pgTable(
  'service',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    icon: text('icon'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => category.id),
    cancelUrl: text('cancel_url'),
    pricingUrl: text('pricing_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('service_sku_key').on(t.sku),
    index('idx_service_category')
      .on(t.categoryId)
      .where(sql`${t.isActive} = true`),
  ],
);

export type Service = typeof service.$inferSelect;
export type NewService = typeof service.$inferInsert;
