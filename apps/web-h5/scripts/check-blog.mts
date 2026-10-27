import { createRequire } from 'node:module';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
const require = createRequire(import.meta.url);
const { loadEnvConfig } = createRequire(require.resolve('next/package.json'))('@next/env') as {
  loadEnvConfig: (root: string, dev: boolean) => void;
};
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ||= path.resolve('data/runtime-config/config.sqlite');
const { currentDatabase } = await import('../db');
const { blogCategory } = await import('../db/scheam');
const { eq } = await import('drizzle-orm');
const { blogListQuery } = await import('../lib/blog/public');

/** 仅查询连接版本、博客字段注释及实际列表 SQL 的 EXPLAIN；不会执行 DDL、初始化或写业务内容。 */
async function run() {
  const database = currentDatabase();
  try {
    const [version] = await database.pool.query<RowDataPacket[]>('SELECT VERSION() AS version');
    console.log('MySQL version:', version[0]?.version);
    const [tables] = await database.pool.query<RowDataPacket[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('blog_article','blog_category','blog_settings','blog_tag','blog_article_tag')"
    );
    console.log(`Blog tables: ${tables.length}/5`);
    if (tables.length !== 5) {
      console.log('博客迁移尚未完成。请先运行 db:migrate，再运行 db:seed:blog。');
      process.exitCode = 1;
      return;
    }
    const [columns] = await database.pool.query<RowDataPacket[]>(
      "SELECT COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('blog_article','blog_category','blog_settings','blog_tag','blog_article_tag')"
    );
    if (columns.some(column => !column.COLUMN_COMMENT)) throw new Error('Missing blog column comments');
    console.log('Column comments: complete');
    const categories = await database.db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(eq(blogCategory.isPublished, true));
    const ids = categories.map(category => category.id);
    const queries = [{ q: '', page: 1 }, ...ids.slice(0, 1).map(categoryId => ({ q: '', page: 1, categoryId }))];
    for (const query of queries) {
      // 索引检查串行执行，输出不包含连接串、正文或凭证。
      // oxlint-disable-next-line no-await-in-loop
      const compiled = await database.db.transaction(async tx => blogListQuery(tx, query, ids).rows.toSQL());
      // oxlint-disable-next-line no-await-in-loop
      const [rows] = await database.pool.query<RowDataPacket[]>(`EXPLAIN ${compiled.sql}`, compiled.params);
      console.log(
        'Blog list EXPLAIN:',
        rows.map(row => ({ table: row.table, key: row.key, possibleKeys: row.possible_keys, extra: row.Extra }))
      );
    }
  } finally {
    await database.pool.end();
  }
}
run().catch(() => {
  console.error('博客检查失败，请检查数据库连接、权限和迁移状态');
  process.exitCode = 1;
});
