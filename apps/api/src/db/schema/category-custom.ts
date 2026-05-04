import { index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { customer } from './customer';
import { project } from './project';

export const categoryCustom = pgTable(
  'category_custom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('category_custom_sku_key').on(t.sku),
    uniqueIndex('category_custom_customer_project_name_key').on(t.customerId, t.projectId, t.name),
    index('idx_category_custom_customer_project').on(t.customerId, t.projectId),
  ],
);

export type CategoryCustom = typeof categoryCustom.$inferSelect;
export type NewCategoryCustom = typeof categoryCustom.$inferInsert;
