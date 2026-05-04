import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const category = pgTable(
  'category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 12 }).notNull(),
    nameRu: varchar('name_ru', { length: 50 }).notNull(),
    nameEn: varchar('name_en', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }),
  },
  (t) => [
    uniqueIndex('category_sku_key').on(t.sku),
    uniqueIndex('category_name_ru_key').on(t.nameRu),
    uniqueIndex('category_name_en_key').on(t.nameEn),
  ],
);

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
