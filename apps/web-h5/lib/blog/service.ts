import {
  type BlogAdminData,
  type BlogArticle,
  type BlogCommand,
  type BlogDraft,
  type BlogRecord,
  adminSchema,
  articleSchema,
  commandSchema,
  draftSchemas,
  normalizeTag
} from '@go-tech/blog-content/model';
import { and, eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { blogArticle, blogArticleTag, blogCategory, blogSettings, blogTag } from '@/db/scheam';
import { BlogError } from './error';
export { BlogError } from './error';
const tables = { article: blogArticle, category: blogCategory, settings: blogSettings };
type Database = Awaited<ReturnType<typeof getDb>>;
export type BlogTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export const utcNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export async function readBlogAdmin(): Promise<BlogAdminData> {
  const db = await getDb();
  const [articles, categories, settings] = await Promise.all([
    db.select().from(blogArticle),
    db.select().from(blogCategory),
    db.select().from(blogSettings)
  ]);
  return adminSchema.parse({ articles, categories, settings });
}
/** 发布标签归一化去重；关联与文章快照在同一事务中提交。 */
export async function publishTags(tx: BlogTransaction, articleId: number, tags: string[]) {
  await tx.delete(blogArticleTag).where(eq(blogArticleTag.articleId, articleId));
  await Promise.all(
    tags.map(async name => {
      const normalizedName = normalizeTag(name);
      await tx.insert(blogTag).values({ name, normalizedName }).onDuplicateKeyUpdate({ set: { normalizedName } });
      const [tag] = await tx.select({ id: blogTag.id }).from(blogTag).where(eq(blogTag.normalizedName, normalizedName));
      if (!tag) throw new BlogError('標籤儲存失敗', 503);
      await tx.insert(blogArticleTag).values({ articleId, tagId: tag.id });
    })
  );
}
export function publicationFields(article: BlogArticle) {
  return {
    title: article.title,
    excerpt: article.excerpt,
    isFeatured: article.isFeatured,
    sortOrder: article.sortOrder,
    displayDate: article.displayDate,
    publishedCategoryId: article.categoryId
  };
}
function parseCommand(input: unknown) {
  const result = commandSchema.safeParse(input);
  if (!result.success) throw new BlogError('操作參數無效');
  const command = result.data;
  if (command.action !== 'create' && (!command.id || !command.version)) throw new BlogError('缺少內容編號或版本');
  if (command.kind === 'settings' && ['create', 'delete', 'unpublish'].includes(command.action))
    throw new BlogError('頁面設定只支援儲存及發佈');
  return command;
}
async function validateArticle(tx: BlogTransaction, article: BlogArticle, row?: BlogRecord) {
  if (row?.lockedSlug && row.lockedSlug !== article.slug) throw new BlogError('首次發佈後 URL 標識不可更改', 409);
  const [category] = await tx.select().from(blogCategory).where(eq(blogCategory.id, article.categoryId));
  if (!category) throw new BlogError('所屬分類不存在');
  const [duplicate] = await tx
    .select({ id: blogArticle.id })
    .from(blogArticle)
    .where(eq(blogArticle.slug, article.slug));
  if (duplicate && duplicate.id !== row?.id) throw new BlogError('此 URL 標識已被使用', 409);
  return category;
}
async function createEntry(
  tx: BlogTransaction,
  command: BlogCommand,
  { actor, draft }: { actor: number; draft: BlogDraft }
) {
  const values = { draft, updatedBy: actor, updatedAt: utcNow() };
  if (command.kind === 'article') {
    const article = articleSchema.parse(draft);
    await validateArticle(tx, article);
    const [created] = await tx
      .insert(blogArticle)
      .values({ ...values, slug: article.slug, categoryId: article.categoryId })
      .$returningId();
    return created?.id;
  }
  const [created] = await tx.insert(blogCategory).values(values).$returningId();
  return created?.id;
}
function parseDraft(command: BlogCommand) {
  if (command.action !== 'save' && command.action !== 'create') return undefined;
  const result = draftSchemas[command.kind].safeParse(command.draft);
  if (!result.success) throw new BlogError(result.error.issues[0]?.message ?? '內容格式無效');
  return result.data;
}
function publicationUpdate(
  command: BlogCommand,
  row: BlogRecord,
  { common, draft }: { common: { updatedAt: string; version: number }; draft?: BlogDraft }
) {
  if (command.action === 'publish')
    return {
      published: row.draft,
      publishedVersion: common.version,
      publishedAt: common.updatedAt,
      isPublished: true,
      publicationState: 'published' as const
    };
  if (command.action === 'unpublish')
    return {
      published: null,
      publishedVersion: null,
      publishedAt: null,
      isPublished: false,
      publicationState: 'offline' as const
    };
  return { draft };
}
function articleUpdate(action: BlogCommand['action'], article: BlogArticle) {
  if (action === 'save') return { slug: article.slug, categoryId: article.categoryId };
  if (action === 'publish') return { ...publicationFields(article), lockedSlug: article.slug };
  return { publishedCategoryId: null, title: null, excerpt: null, isFeatured: false, sortOrder: 0, displayDate: null };
}

/** 共用设置行锁串行化分类删除、文章迁移和发布，版本锁避免覆盖其他管理员的修改。 */
export async function mutateBlog(input: unknown, actor: number) {
  const command = parseCommand(input);
  const draft = parseDraft(command);
  const db = await getDb();
  return db.transaction(async tx => {
    const [lock] = await tx
      .select({ id: blogSettings.id })
      .from(blogSettings)
      .where(eq(blogSettings.id, 1))
      .for('update');
    if (!lock) throw new BlogError('博客尚未初始化，請先執行初始化腳本', 503);
    if (command.action === 'create') {
      if (!draft) throw new BlogError('缺少草稿');
      return createEntry(tx, command, { draft, actor });
    }
    const table = tables[command.kind];
    const [raw] = await tx
      .select()
      .from(table)
      .where(eq(table.id, command.id ?? 0))
      .for('update');
    if (!raw) throw new BlogError('內容不存在', 404);
    const row = { ...raw, draft: draftSchemas[command.kind].parse(raw.draft) };
    if (row.version !== command.version) throw new BlogError('內容已被其他管理員修改，請重新載入後再編輯', 409);
    if (command.action === 'delete') {
      if (row.isPublished) throw new BlogError('請先下架已發佈內容', 409);
      if (command.kind === 'category') {
        const [reference] = await tx
          .select({ id: blogArticle.id })
          .from(blogArticle)
          .where(or(eq(blogArticle.categoryId, row.id), eq(blogArticle.publishedCategoryId, row.id)))
          .limit(1);
        if (reference) throw new BlogError('此分類仍被草稿或已發佈文章引用', 409);
      }
      await tx.delete(table).where(and(eq(table.id, row.id), eq(table.version, row.version)));
      return row.id;
    }
    const common = { version: row.version + 1, updatedBy: actor, updatedAt: utcNow() };
    const publication = publicationUpdate(command, row, { common, draft });
    if (command.kind === 'article') {
      const article = articleSchema.parse(draft ?? row.draft);
      const category = await validateArticle(tx, article, row);
      if (command.action === 'publish' && !category.isPublished) throw new BlogError('請先發佈所屬分類');
      const extra = articleUpdate(command.action, article);
      await tx
        .update(blogArticle)
        .set({ ...common, ...publication, ...extra })
        .where(and(eq(blogArticle.id, row.id), eq(blogArticle.version, row.version)));
      if (command.action === 'publish') await publishTags(tx, row.id, article.tags);
      if (command.action === 'unpublish') await tx.delete(blogArticleTag).where(eq(blogArticleTag.articleId, row.id));
    } else {
      await tx
        .update(table)
        .set({ ...common, ...publication })
        .where(and(eq(table.id, row.id), eq(table.version, row.version)));
    }
    return row.id;
  });
}
