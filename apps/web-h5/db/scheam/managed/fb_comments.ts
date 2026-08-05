import { sql } from 'drizzle-orm';
import { bigint, boolean, datetime, foreignKey, index, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { fbFeature } from './fb_feature';

/**
 * 留言 / 官方回覆。
 *
 * - 留言與回覆共用本表，parent_id 為 NULL 即一級留言。
 * - 顯示控制：is_visible（可逆的後台隱藏，資料保留）。
 * - 軟刪除：一律寫 deleted_at，不做實體 DELETE。
 * - 前台查詢條件：deleted_at IS NULL AND is_visible = 1。
 */
export const fbComment = mysqlTable(
  'fb_comment',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    featureId: bigint('feature_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => fbFeature.id, { onDelete: 'cascade' }),
    /** 回覆的上層留言；NULL 表示一級留言 */
    parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
    /** 普通留言指向 platform_customer；官方回复指向 ums_admin，由 is_official 区分。 */
    authorId: bigint('author_id', { mode: 'number', unsigned: true }).notNull(),
    content: text('content').notNull(),
    /** 官方回覆（深色氣泡） */
    isOfficial: boolean('is_official').notNull().default(false),
    /** 前台是否顯示：true 顯示 / false 隱藏（後台可切換） */
    isVisible: boolean('is_visible').notNull().default(true),
    /** 最近一次被隱藏的時間 */
    hiddenAt: datetime('hidden_at'),
    /** 操作隱藏的管理者 */
    hiddenBy: bigint('hidden_by', { mode: 'number', unsigned: true }),
    /** 隱藏原因（違規 / 廣告等） */
    hiddenReason: varchar('hidden_reason', { length: 255 }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    /** 軟刪除時間；NULL 表示未刪除 */
    deletedAt: datetime('deleted_at'),
    /** 執行軟刪除的用戶或管理者 */
    deletedBy: bigint('deleted_by', { mode: 'number', unsigned: true })
  },
  t => [
    index('idx_comment_feature').on(t.featureId, t.deletedAt, t.isVisible, t.createdAt),
    index('idx_comment_parent').on(t.parentId, t.createdAt),
    index('idx_comment_author_official').on(t.authorId, t.isOfficial),
    foreignKey({
      name: 'fk_comment_parent',
      columns: [t.parentId],
      foreignColumns: [t.id]
    }).onDelete('cascade')
  ]
);

export type FbComment = typeof fbComment.$inferSelect;
export type NewFbComment = typeof fbComment.$inferInsert;
