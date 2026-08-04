import { sql } from 'drizzle-orm';
import { datetime, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

/** 主題分類（租務部 / 場務部 / 會計部 / 客服 / 系統設定 / 其他） */
export const fbCategory = mysqlTable(
  'fb_category',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 32 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    /** Lucide icon 名稱 */
    icon: varchar('icon', { length: 32 }).notNull().default(''),
    sortOrder: int('sort_order').notNull().default(0),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  t => [uniqueIndex('uk_category_name').on(t.name)]
);

/** 子分類（合同管理 / 報表匯出 / ...） */
export const fbSubCategory = mysqlTable(
  'fb_sub_category',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    categoryId: int('category_id', { unsigned: true })
      .notNull()
      .references(() => fbCategory.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 32 }).notNull(),
    sortOrder: int('sort_order').notNull().default(0)
  },
  t => [uniqueIndex('uk_sub_cat_name').on(t.categoryId, t.name)]
);

export type FbCategory = typeof fbCategory.$inferSelect;
export type NewFbCategory = typeof fbCategory.$inferInsert;
export type FbSubCategory = typeof fbSubCategory.$inferSelect;
export type NewFbSubCategory = typeof fbSubCategory.$inferInsert;
