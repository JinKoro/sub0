import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const notificationEventPreference = pgTable(
  'notification_event_preference',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    eventId: integer('event_id').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    channelTypeIds: integer('channel_type_ids')
      .array()
      .notNull()
      .default(sql`'{}'::int[]`),
    daysBefore: integer('days_before')
      .array()
      .notNull()
      .default(sql`'{}'::int[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('notification_event_preference_customer_event_key').on(
      t.customerId,
      t.eventId,
    ),
  ],
);

export type NotificationEventPreference = typeof notificationEventPreference.$inferSelect;
export type NewNotificationEventPreference = typeof notificationEventPreference.$inferInsert;
