import {
  BLOG_PAGE_SIZE,
  type BlogDetail,
  type BlogList,
  type BlogQuery,
  type BlogSummary,
  articleSchema,
  categorySchema,
  normalizeTag,
  querySchema,
  settingsSchema
} from '@go-tech/blog-content/model';
import { and, asc, count, desc, eq, exists, inArray, ne, or, sql } from 'drizzle-orm';
import { cache } from 'react';
import { getDb } from '@/db';
import { blogArticle, blogArticleTag, blogCategory, blogSettings, blogTag } from '@/db/scheam';
import { BlogError } from './error';
import type { BlogTransaction } from './service';
export function parseBlogQuery(input: unknown): BlogQuery {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) throw new BlogError('搜尋或分頁參數無效');
  return parsed.data;
}
/** 使用 ! 作为 LIKE 转义字符；% 和 _ 按字面搜索，不受 NO_BACKSLASH_ESCAPES 影响。 */
export function escapeLike(value: string) {
  return value.replace(/[!%_]/g, char => `!${char}`);
}
const visible = () => and(eq(blogArticle.isPublished, true), eq(blogCategory.isPublished, true));
export const blogOrder = () => [
  desc(blogArticle.isFeatured),
  asc(blogArticle.sortOrder),
  desc(blogArticle.displayDate),
  desc(blogArticle.id)
];
export function blogListQuery(db: BlogTransaction, query: BlogQuery, categoryIds: number[]) {
  const pattern = `%${escapeLike(query.q)}%`;
  const contains = (column: typeof blogArticle.title | typeof blogArticle.excerpt | typeof blogTag.name) =>
    sql`${column} LIKE ${pattern} ESCAPE '!'`;
  const tagMatch = db
    .select({ id: blogArticleTag.articleId })
    .from(blogArticleTag)
    .innerJoin(blogTag, eq(blogTag.id, blogArticleTag.tagId))
    .where(
      and(
        eq(blogArticleTag.articleId, blogArticle.id),
        sql`${blogTag.normalizedName} LIKE ${`%${escapeLike(normalizeTag(query.q))}%`} ESCAPE '!'`
      )
    );
  let categoryCondition = categoryIds.length ? inArray(blogArticle.publishedCategoryId, categoryIds) : sql`false`;
  if (query.categoryId) {
    categoryCondition = categoryIds.includes(query.categoryId)
      ? eq(blogArticle.publishedCategoryId, query.categoryId)
      : sql`false`;
  }
  const condition = and(
    eq(blogArticle.isPublished, true),
    categoryCondition,
    query.q ? or(contains(blogArticle.title), contains(blogArticle.excerpt), exists(tagMatch)) : undefined
  );
  return {
    condition,
    rows: db
      .select({ id: blogArticle.id, published: blogArticle.published, categoryId: blogArticle.publishedCategoryId })
      .from(blogArticle)
      .where(condition)
      .orderBy(...blogOrder())
      .limit(BLOG_PAGE_SIZE)
      .offset((query.page - 1) * BLOG_PAGE_SIZE)
  };
}
function categoryDraft(categories: BlogList['categories'], id: number | null) {
  const category = categories.find(item => item.id === id);
  if (!category) throw new BlogError('文章分類已不可用', 503);
  return { name: category.name, sortOrder: category.sortOrder };
}
function summary(row: { category: unknown; id: number; published: unknown }): BlogSummary {
  const { body: _body, ...article } = articleSchema.parse(row.published);
  return { ...article, id: row.id, category: categorySchema.parse(row.category).name };
}
async function settings(db: BlogTransaction) {
  const [row] = await db
    .select({ published: blogSettings.published })
    .from(blogSettings)
    .where(and(eq(blogSettings.id, 1), eq(blogSettings.isPublished, true)));
  if (!row) throw new BlogError('博客尚未初始化或發佈', 503);
  return settingsSchema.parse(row.published);
}
export async function readBlogList(input: unknown): Promise<BlogList> {
  const query = parseBlogQuery(input);
  return (await getDb()).transaction(async tx => {
    const config = await settings(tx);
    const categories = (await tx.select().from(blogCategory).where(eq(blogCategory.isPublished, true)))
      .map(row => ({ ...categorySchema.parse(row.published), id: row.id }))
      .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const { condition, rows } = blogListQuery(
      tx,
      query,
      categories.map(category => category.id)
    );
    const [total] = await tx.select({ value: count() }).from(blogArticle).where(condition);
    return {
      settings: config,
      categories,
      articles: (await rows).map(row => summary({ ...row, category: categoryDraft(categories, row.categoryId) })),
      query,
      page: query.page,
      pageSize: BLOG_PAGE_SIZE,
      total: total?.value ?? 0
    };
  });
}
/** 请求内去重即可；不缓存跨请求的发布快照，以便发布/下架即时可见。 */
export const readBlogDetail = cache(async (slug: string): Promise<BlogDetail> => {
  return (await getDb()).transaction(async tx => {
    const [row] = await tx
      .select({ id: blogArticle.id, published: blogArticle.published, category: blogCategory.published })
      .from(blogArticle)
      .innerJoin(blogCategory, eq(blogCategory.id, blogArticle.publishedCategoryId))
      .where(and(visible(), eq(blogArticle.slug, slug)))
      .limit(1);
    if (!row) throw new BlogError('找不到此文章', 404);
    const related = await tx
      .select({ id: blogArticle.id, published: blogArticle.published, category: blogCategory.published })
      .from(blogArticle)
      .innerJoin(blogCategory, eq(blogCategory.id, blogArticle.publishedCategoryId))
      .where(and(visible(), ne(blogArticle.id, row.id)))
      .orderBy(...blogOrder())
      .limit(3);
    return {
      article: { ...articleSchema.parse(row.published), id: row.id, category: categorySchema.parse(row.category).name },
      settings: await settings(tx),
      related: related.map(summary)
    };
  });
});
