import type { ManualDraft } from '@go-tech/manual-content/model';
import { sql } from 'drizzle-orm';
import { datetime, int, json, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

/** 三类手册记录共用的草稿/发布元数据。 MySQL 表和字段的持久化注释由 0008_manual_comments.sql 维护，当前 Drizzle 不提供对应声明 API。 */
const fields = () => ({
  /** 主键；主题和指南自动分配，首页设置固定使用 1。 */
  id: int({ unsigned: true }).primaryKey().autoincrement(),
  /** 每次保存、发布或下架递增；客户端提交旧版本时拒绝覆盖。 */
  version: int().notNull().default(1),
  /** 可编辑草稿，结构按记录种类校验；修改不会直接影响前台。 */
  draft: json().$type<ManualDraft>().notNull(),
  /** 前台读取的完整发布快照；NULL 表示未发布或已下架。 */
  published: json().$type<ManualDraft>(),
  /** 发布快照对应的记录版本；保存新草稿不会改变此值。 */
  publishedVersion: int('published_version'),
  /** 最近一次发布的 UTC 时间；下架时清空。 */
  publishedAt: datetime('published_at', { mode: 'string' }),
  /** 最近写入的 UTC 时间，由应用显式维护。 */
  updatedAt: datetime('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  /** 最近修改的管理员 ID；初始化数据使用 0。 */
  updatedBy: int('updated_by', { unsigned: true }).notNull(),
  /** 指南首次发布时锁定的 URL；下架后仍保留，其他记录种类固定为 NULL。 */
  lockedSlug: varchar('locked_slug', { length: 120 })
});
/** 手册主题；下架后，其已发布指南也从前台隐藏。 */
export const manualCategory = mysqlTable('manual_category', fields());
/** 首页文案单例；ID 1 还用于初始化判定和串行化所有手册写入。 */
export const manualSettings = mysqlTable('manual_settings', fields());
/** 指南正文与元数据；草稿和发布版的主题关联必须独立保留。 */
export const manualArticle = mysqlTable('manual_article', {
  ...fields(),
  /** 唯一 URL 标识，保存时与草稿同步，首次发布后禁止修改。 */
  slug: varchar({ length: 120 }).notNull().unique(),
  /** 草稿主题的真实外键，避免删除仍被未发布修改引用的主题。 */
  categoryId: int('category_id', { unsigned: true })
    .notNull()
    .references(() => manualCategory.id, { onDelete: 'restrict' }),
  /** 公开版本的主题外键；移动草稿主题后，旧公开关联仍需保留至再次发布。 */
  publishedCategoryId: int('published_category_id', { unsigned: true }).references(() => manualCategory.id, {
    onDelete: 'restrict'
  })
});
