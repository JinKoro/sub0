import { integer, numeric, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Курсы валют относительно RUB. Источник — ЦБ РФ (XML pull раз в сутки).
 * Одна строка на currency_id; обновляется UPSERT'ом. История курсов не хранится
 * (для аналитики в MVP не нужна; добавим отдельную таблицу когда понадобится).
 *
 * `source_at` — дата, на которую ЦБ опубликовал курс.
 * `fetched_at` — когда мы получили этот курс из ЦБ.
 * `stale` высчитывается на чтении из `now() - source_at > 48h`.
 */
export const exchangeRate = pgTable(
  'exchange_rate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    currencyId: integer('currency_id').notNull(),
    /** rate = сколько RUB за 1 единицу currencyId. */
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    sourceAt: timestamp('source_at', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('exchange_rate_currency_id_key').on(t.currencyId)],
);

export type ExchangeRate = typeof exchangeRate.$inferSelect;
export type NewExchangeRate = typeof exchangeRate.$inferInsert;
