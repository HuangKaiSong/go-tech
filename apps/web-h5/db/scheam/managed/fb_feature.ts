import { sql } from 'drizzle-orm';
import { bigint, date, datetime, index, int, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { platformCustomer } from '../external/platform_customer';
import { fbCategory, fbSubCategory } from './fb_categories';

/** 建議狀態：待評估 / 開發中 / 已完成 */
export const featureStatus = ['pending', 'developing', 'shipped'] as const;
export type FeatureStatus = (typeof featureStatus)[number];

/**
 * 需求建議。
 *
 * 註：中文搜尋所需的 ngram 全文索引 drizzle-kit 無法產生， 於 migration 後補執行： ALTER TABLE fb_feature ADD FULLTEXT KEY ft_feature_search
 * (title, description) WITH PARSER ngram;
 */
export const fbFeature = mysqlTable(
  'fb_feature',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description').notNull(),
    categoryId: int('category_id', { unsigned: true })
      .notNull()
      .references(() => fbCategory.id),
    subCategoryId: int('sub_category_id', { unsigned: true }).references(() => fbSubCategory.id),
    authorId: bigint('author_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => platformCustomer.id),
    status: mysqlEnum('status', featureStatus).notNull().default('pending'),
    /** 冗餘計數，來源 fb_vote */
    likeCount: int('like_count', { unsigned: true }).notNull().default(0),
    /** 只累計 deleted_at IS NULL AND is_visible = 1 的留言與回覆 */
    commentCount: int('comment_count', { unsigned: true }).notNull().default(0),
    /** 已完成上線日 */
    shippedAt: date('shipped_at'),
    /** 如 v2.32.0 */
    version: varchar('version', { length: 24 }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    /** 軟刪除時間；NULL 表示未刪除 */
    deletedAt: datetime('deleted_at')
  },
  t => [
    index('idx_feature_cat_status').on(t.categoryId, t.status, t.likeCount),
    index('idx_feature_sub').on(t.subCategoryId),
    index('idx_feature_created').on(t.createdAt),
    index('idx_feature_author').on(t.authorId)
  ]
);

export type FbFeature = typeof fbFeature.$inferSelect;
export type NewFbFeature = typeof fbFeature.$inferInsert;
