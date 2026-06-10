import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const notificationChannel = pgTable(
  'notification_channel',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    typeId: integer('type_id').notNull(),
    // email / @handle / chat-id. Для EMAIL = customer.email.
    address: varchar('address', { length: 255 }).notNull(),
    // Канал считается «активным» только при enabled = true AND verified_at NOT NULL.
    // Для EMAIL ставится сразу (email подтверждён до первой оплаты). Для TG/MAX —
    // выставит будущий bot-webhook, когда юзер пройдёт по deep-link.
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    enabled: boolean('enabled').notNull().default(true),
    // Одноразовый nonce для connect-link (TG/MAX). Гасится при verify/disconnect.
    connectNonce: varchar('connect_nonce', { length: 64 }),
    connectNonceExpiresAt: timestamp('connect_nonce_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    uniqueIndex('notification_channel_customer_type_key').on(t.customerId, t.typeId),
    // Hot-path воркера: активные каналы customer'а.
    index('notification_channel_active_idx')
      .on(t.customerId)
      .where(sql`${t.enabled} = true AND ${t.verifiedAt} IS NOT NULL`),
  ],
);

export type NotificationChannel = typeof notificationChannel.$inferSelect;
export type NewNotificationChannel = typeof notificationChannel.$inferInsert;
