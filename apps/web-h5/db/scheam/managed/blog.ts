import type { BlogDraft } from '@go-tech/blog-content/model';
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  uniqueIndex,
  varchar
} from 'drizzle-orm/mysql-core';

/** JSON 保存草稿及发布快照；关系字段仅用于关联约束或索引查询，数据库注释见博客迁移。 */
const fields = () => ({
  id: int({ unsigned: true }).primaryKey().autoincrement(),
  version: int({ unsigned: true }).notNull().default(1),
  draft: json().$type<BlogDraft>().notNull(),
  published: json().$type<BlogDraft>(),
  publishedVersion: int('published_version', { unsigned: true }),
  publishedAt: datetime('published_at', { mode: 'string' }),
  updatedAt: datetime('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by', { unsigned: true }).notNull(),
  lockedSlug: varchar('locked_slug', { length: 120 }),
  publicationState: mysqlEnum('publication_state', ['draft', 'published', 'offline']).notNull().default('draft'),
  isPublished: boolean('is_published').notNull().default(false)
});
export const blogCategory = mysqlTable('blog_category', fields());
export const blogSettings = mysqlTable('blog_settings', fields());
export const blogArticle = mysqlTable(
  'blog_article',
  {
    ...fields(),
    slug: varchar({ length: 120 }).notNull(),
    categoryId: int('category_id', { unsigned: true })
      .notNull()
      .references(() => blogCategory.id, { onDelete: 'restrict' }),
    publishedCategoryId: int('published_category_id', { unsigned: true }).references(() => blogCategory.id, {
      onDelete: 'restrict'
    }),
    title: varchar({ length: 200 }),
    excerpt: varchar({ length: 2000 }),
    isFeatured: boolean('is_featured').notNull().default(false),
    sortOrder: int('sort_order', { unsigned: true }).notNull().default(0),
    displayDate: date('display_date', { mode: 'string' })
  },
  t => [
    uniqueIndex('uk_blog_article_slug').on(t.slug),
    index('idx_blog_public_order').on(
      t.isPublished,
      sql`is_featured desc`,
      t.sortOrder,
      sql`display_date desc`,
      sql`id desc`
    ),
    index('idx_blog_category_order').on(
      t.publishedCategoryId,
      t.isPublished,
      sql`is_featured desc`,
      t.sortOrder,
      sql`display_date desc`,
      sql`id desc`
    ),
    index('idx_blog_admin_state').on(t.publicationState, t.updatedAt, t.id)
  ]
);
export const blogTag = mysqlTable(
  'blog_tag',
  {
    id: int({ unsigned: true }).primaryKey().autoincrement(),
    name: varchar({ length: 80 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 160 }).notNull()
  },
  t => [uniqueIndex('uk_blog_tag_name').on(t.normalizedName)]
);
/** 仅保存发布版标签；草稿标签保留在 draft JSON 中。 */
export const blogArticleTag = mysqlTable(
  'blog_article_tag',
  {
    articleId: int('article_id', { unsigned: true })
      .notNull()
      .references(() => blogArticle.id, { onDelete: 'cascade' }),
    tagId: int('tag_id', { unsigned: true })
      .notNull()
      .references(() => blogTag.id, { onDelete: 'restrict' })
  },
  t => [primaryKey({ columns: [t.articleId, t.tagId] }), index('idx_blog_tag_article').on(t.tagId, t.articleId)]
);
