import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { customer } from './customer';

export const oauthAccount = pgTable(
  'oauth_account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
    providerId: integer('provider_id').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('oauth_account_provider_key').on(t.providerId, t.providerUserId),
    uniqueIndex('oauth_account_customer_provider_key').on(t.customerId, t.providerId),
    index('idx_oauth_account_customer').on(t.customerId),
  ],
);

export type OAuthAccount = typeof oauthAccount.$inferSelect;
export type NewOAuthAccount = typeof oauthAccount.$inferInsert;
