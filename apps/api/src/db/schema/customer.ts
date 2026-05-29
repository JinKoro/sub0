import { Currency, CustomerState, Locale, Plan } from '@subzero/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const customer = pgTable(
  'customer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: text('password_hash'),
    name: varchar('name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    timezone: varchar('timezone', { length: 64 }).notNull(),
    localeId: integer('locale_id').notNull().default(Locale.RU),
    currencyId: integer('currency_id').notNull().default(Currency.RUB),
    planId: integer('plan_id').notNull().default(Plan.FREE),
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
    stateId: integer('state_id').notNull().default(CustomerState.CREATED),
    // Факт явного согласия на маркетинговые рассылки (152-ФЗ / ФЗ-38).
    // NULL = согласие не давалось либо отозвано.
    marketingConsentAt: timestamp('marketing_consent_at', { withTimezone: true }),
    // MVP email-нотификации: общий тоггл + дни до списания (массив, чтобы
    // безболезненно мигрировать к v1.1 матрице per-event days_before).
    notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
    notificationLeadDays: integer('notification_lead_days')
      .array()
      .notNull()
      .default(sql`'{3}'::int[]`),
    // Quiet hours интерпретируются в `timezone` customer'а. Воркер NOT
    // отправляет уведомление, если локальное `now()` попадает в окно.
    // `from = to` трактуем как «всё время выключено».
    quietHoursEnabled: boolean('quiet_hours_enabled').notNull().default(false),
    quietHoursFrom: time('quiet_hours_from'),
    quietHoursTo: time('quiet_hours_to'),
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
