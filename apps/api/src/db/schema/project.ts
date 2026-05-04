import { ProjectState } from '@subzero/shared';
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const project = pgTable(
  'project',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }),
    stateId: integer('state_id').notNull().default(ProjectState.ACTIVE),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('project_sku_key').on(t.sku),
    index('idx_project_customer')
      .on(t.customerId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;
