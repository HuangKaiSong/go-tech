import { readFileSync } from 'node:fs';
/* oxlint-disable no-await-in-loop -- Migration DDL and EXPLAIN queries must run in order on the isolated test database. */
import { createRequire } from 'node:module';
import path from 'node:path';
import { articleSchema } from '@go-tech/blog-content/model';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/db';
import * as schema from '@/db/scheam';
import { blogArticle, blogArticleTag, blogCategory } from '@/db/scheam/managed/blog';
import { seedBlog } from '@/db/seeds/blog';
import { effectiveValues } from '@/lib/runtime-config/definitions';
import { readInfrastructure } from '@/lib/runtime-config/sqlite';
import { blogListQuery, readBlogDetail, readBlogList } from './public';
import { mutateBlog } from './service';
vi.mock('@/db', () => ({ getDb: vi.fn() }));
const enabled = process.env.BLOG_MYSQL_TEST === '1';
let pool: Pool;
let admin: mysql.Connection;
const databaseName = `codex_blog_test_${Date.now()}_${process.pid}`;
let created = false;
let db: Awaited<ReturnType<typeof getDb>>;
beforeAll(async () => {
  if (!enabled) return;
  const require = createRequire(path.resolve('package.json'));
  const { loadEnvConfig } = createRequire(require.resolve('next/package.json'))('@next/env') as {
    loadEnvConfig: (root: string, dev: boolean) => void;
  };
  loadEnvConfig(process.cwd(), true);
  process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ||= path.resolve('data/runtime-config/config.sqlite');
  const value = process.env.BLOG_TEST_DATABASE_URL || effectiveValues(readInfrastructure().overrides).DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL 尚未配置');
  const url = new URL(value);
  url.pathname = '/';
  admin = await mysql.createConnection(url.toString());
  await admin.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin`);
  created = true;
  url.pathname = `/${databaseName}`;
  pool = mysql.createPool({ uri: url.toString(), connectionLimit: 4 });
  db = drizzle(pool, { schema, mode: 'default' });
  for (const statement of readFileSync('drizzle/0009_blog_content.sql', 'utf8').split('--> statement-breakpoint')) {
    if (statement.trim()) await pool.query(statement);
  }
  vi.mocked(getDb).mockResolvedValue(db);
}, 20_000);
afterAll(async () => {
  if (!enabled) return;
  if (pool) await pool.end();
  if (created) await admin.query(`DROP DATABASE \`${databaseName}\``);
  if (admin) await admin.end();
});
describe.skipIf(!enabled)('blog on an isolated MySQL schema', () => {
  it('migrates all columns with comments and seeds once without overwriting edits', async () => {
    expect(await seedBlog(db)).toBe(true);
    const first = await readBlogList({});
    expect(first.articles).toHaveLength(6);
    expect(first.categories).toHaveLength(4);
    expect(first.articles[0]?.slug).toBe('hk-imported-worker-dormitory');
    const [comments] = await pool.query<RowDataPacket[]>(
      'SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?',
      [databaseName]
    );
    expect(comments.length).toBeGreaterThan(40);
    expect(comments.every(row => Boolean(row.COLUMN_COMMENT))).toBe(true);
    const original = first.articles[0];
    if (!original) throw new Error('Missing seed');
    const [record] = await db.select().from(blogArticle).where(eq(blogArticle.id, original.id));
    if (!record) throw new Error('Missing seed row');
    await mutateBlog(
      {
        kind: 'article',
        action: 'save',
        id: record.id,
        version: record.version,
        draft: { ...articleSchema.parse(record.draft), title: '新草稿標題', tags: ['新標籤'], isFeatured: false }
      },
      9
    );
    expect(await seedBlog(db)).toBe(false);
    expect((await readBlogDetail(original.slug)).article.title).toBe(original.title);
    expect((await readBlogList({ q: '新標籤' })).total).toBe(0);
  });
  it('rejects conflicts and duplicate URLs; publishes only the saved version and normalizes tags', async () => {
    const [row] = await db.select().from(blogArticle).where(eq(blogArticle.slug, 'hk-imported-worker-dormitory'));
    if (!row) throw new Error('Missing article');
    await expect(
      mutateBlog({ kind: 'article', action: 'publish', id: row.id, version: row.version - 1 }, 9)
    ).rejects.toMatchObject({ status: 409 });
    const article = articleSchema.parse(row.draft);
    await expect(mutateBlog({ kind: 'article', action: 'create', draft: article }, 9)).rejects.toMatchObject({
      status: 409
    });
    await mutateBlog(
      {
        kind: 'article',
        action: 'save',
        id: row.id,
        version: row.version,
        draft: { ...article, tags: ['ＧＯ－ＨＲ', 'go-hr', '新標籤'], isFeatured: true }
      },
      9
    );
    await mutateBlog({ kind: 'article', action: 'publish', id: row.id, version: row.version + 1 }, 9);
    const published = await readBlogDetail(row.slug);
    expect(published.article.title).toBe('新草稿標題');
    expect(published.article.tags).toHaveLength(2);
    expect((await readBlogList({ q: '新標籤' })).total).toBe(1);
    expect((await readBlogList({ q: 'go-hr' })).total).toBeGreaterThan(0);
    const tags = await db.select().from(blogArticleTag).where(eq(blogArticleTag.articleId, row.id));
    expect(tags).toHaveLength(2);
    await expect(
      mutateBlog({ kind: 'article', action: 'delete', id: row.id, version: row.version + 2 }, 9)
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      mutateBlog(
        {
          kind: 'article',
          action: 'save',
          id: row.id,
          version: row.version + 2,
          draft: { ...article, slug: 'changed-slug' }
        },
        9
      )
    ).rejects.toMatchObject({ status: 409 });
  });
  it('keeps new drafts private and isolates page settings until publication', async () => {
    const [source] = await db.select().from(blogArticle).limit(1);
    if (!source) throw new Error('Missing source');
    const draft = { ...articleSchema.parse(source.draft), slug: 'private-draft' };
    const id = await mutateBlog({ kind: 'article', action: 'create', draft }, 9);
    await expect(readBlogDetail(draft.slug)).rejects.toMatchObject({ status: 404 });
    expect((await readBlogList({ q: 'private-draft' })).total).toBe(0);
    await mutateBlog({ kind: 'article', action: 'delete', id, version: 1 }, 9);
    const [settings] = await db.select().from(schema.blogSettings).limit(1);
    if (!settings) throw new Error('Missing settings');
    const original = (await readBlogList({})).settings;
    await mutateBlog(
      {
        kind: 'settings',
        action: 'save',
        id: settings.id,
        version: settings.version,
        draft: { ...original, title: '新博客標題' }
      },
      9
    );
    expect((await readBlogList({})).settings.title).toBe(original.title);
    await mutateBlog({ kind: 'settings', action: 'publish', id: settings.id, version: settings.version + 1 }, 9);
    expect((await readBlogList({})).settings.title).toBe('新博客標題');
  });
  it('keeps published category association while editing drafts and blocks referenced category deletion', async () => {
    const [row] = await db.select().from(blogArticle).where(eq(blogArticle.slug, 'tenancy-stamp-duty'));
    if (!row) throw new Error('Missing article');
    const old = articleSchema.parse(row.draft);
    const [other] = await db
      .select()
      .from(blogCategory)
      .where(eq(blogCategory.id, old.categoryId === 1 ? 2 : 1));
    if (!other) throw new Error('Missing category');
    await mutateBlog(
      { kind: 'article', action: 'save', id: row.id, version: row.version, draft: { ...old, categoryId: other.id } },
      9
    );
    expect((await readBlogDetail(row.slug)).article.categoryId).toBe(old.categoryId);
    await mutateBlog({ kind: 'category', action: 'unpublish', id: other.id, version: other.version }, 9);
    await expect(
      mutateBlog({ kind: 'category', action: 'delete', id: other.id, version: other.version + 1 }, 9)
    ).rejects.toMatchObject({ status: 409 });
    await mutateBlog({ kind: 'category', action: 'publish', id: other.id, version: other.version + 1 }, 9);
  });
  it('hides category-down articles, unpublishes and preserves locked slugs', async () => {
    const detail = await readBlogDetail('quarterly-rates-guide');
    const [category] = await db.select().from(blogCategory).where(eq(blogCategory.id, detail.article.categoryId));
    if (!category) throw new Error('Missing category');
    await mutateBlog({ kind: 'category', action: 'unpublish', id: category.id, version: category.version }, 9);
    await expect(readBlogDetail(detail.article.slug)).rejects.toMatchObject({ status: 404 });
    expect((await readBlogList({ categoryId: category.id })).total).toBe(0);
    await mutateBlog({ kind: 'category', action: 'publish', id: category.id, version: category.version + 1 }, 9);
    const [row] = await db.select().from(blogArticle).where(eq(blogArticle.id, detail.article.id));
    if (!row) throw new Error('Missing row');
    await mutateBlog({ kind: 'article', action: 'unpublish', id: row.id, version: row.version }, 9);
    await expect(readBlogDetail(row.slug)).rejects.toMatchObject({ status: 404 });
    await expect(
      mutateBlog(
        {
          kind: 'article',
          action: 'save',
          id: row.id,
          version: row.version + 1,
          draft: { ...articleSchema.parse(row.draft), slug: 'reused' }
        },
        9
      )
    ).rejects.toMatchObject({ status: 409 });
    await mutateBlog({ kind: 'article', action: 'delete', id: row.id, version: row.version + 1 }, 9);
  });
  it('filters combinations and literal wildcard searches; paginates stably and EXPLAINs production queries', async () => {
    const [source] = await db.select().from(blogArticle).limit(1);
    if (!source) throw new Error('Missing source');
    const article = articleSchema.parse(source.published);
    const values = Array.from({ length: 500 }, (_, index) => {
      const draft = {
        ...article,
        title: `test article ${index}`,
        slug: `load-${index}`,
        isFeatured: false,
        sortOrder: index,
        tags: []
      };
      return {
        draft,
        published: draft,
        slug: draft.slug,
        categoryId: article.categoryId,
        publishedCategoryId: article.categoryId,
        title: draft.title,
        excerpt: draft.excerpt,
        displayDate: draft.displayDate,
        sortOrder: index,
        isFeatured: false,
        isPublished: true,
        publicationState: 'published' as const,
        updatedBy: 0
      };
    });
    await db.insert(blogArticle).values(values);
    await pool.query('ANALYZE TABLE blog_article');
    const first = await readBlogList({});
    const second = await readBlogList({ page: 2 });
    expect(first.articles).toHaveLength(12);
    expect(second.articles).toHaveLength(12);
    expect(new Set([...first.articles, ...second.articles].map(row => row.id)).size).toBe(24);
    expect(first.articles[0]?.isFeatured).toBe(true);
    expect((await readBlogList({ page: 999 })).articles).toHaveLength(0);
    expect((await readBlogList({ q: '%' })).total).toBe(0);
    expect((await readBlogList({ q: '_!' })).total).toBe(0);
    expect((await readBlogList({ categoryId: article.categoryId, q: 'test article' })).total).toBe(500);
    expect((await readBlogList({ categoryId: 999, q: 'test article' })).total).toBe(0);
    for (const query of [
      { q: '', page: 1 },
      { q: '', page: 1, categoryId: article.categoryId }
    ]) {
      const built = await db.transaction(async tx => blogListQuery(tx, query, [1, 2, 3, 4]).rows.toSQL());
      const [explain] = await pool.query<RowDataPacket[]>(`EXPLAIN ${built.sql}`, built.params);
      const row = explain.find(item => item.table === 'blog_article');
      expect(row).toBeDefined();
      console.log('Blog query EXPLAIN', {
        category: Boolean(query.categoryId),
        key: row?.key,
        possibleKeys: row?.possible_keys,
        extra: row?.Extra
      });
      expect(String(row?.key)).toBe(query.categoryId ? 'idx_blog_category_order' : 'idx_blog_public_order');
    }
    // 本测试结束后整个专用数据库由 afterAll 清理。
  });
});
