import { boolean, index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Auth lockout state (ctx-security §2). Internal, not a domain entity —
 * no sku / version / deleted_at (cf. refresh_token, mail_outbox). Rows are
 * pruned by the retention cron once past the lockout window.
 */
export const loginAttempt = pgTable(
  'login_attempt',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 254 }).notNull(),
    ip: varchar('ip', { length: 45 }),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Lockout counts failures per email+ip inside the 15-min window.
    index('idx_login_attempt_window').on(t.email, t.ip, t.createdAt),
  ],
);

export type LoginAttemptRow = typeof loginAttempt.$inferSelect;
export type NewLoginAttemptRow = typeof loginAttempt.$inferInsert;
