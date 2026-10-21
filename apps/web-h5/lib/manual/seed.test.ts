/** 验证旧内容转换、初始化幂等性及迁移的增量性质，不连接远程数据库。 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { richDocumentSchema } from '@go-tech/manual-content/model';
import { describe, expect, it, vi } from 'vitest';
import { getDb } from '@/db';
import { manualArticle, manualCategory, manualSettings } from '@/db/scheam/managed/manual';
import { seedManual } from '@/db/seeds/manual';
vi.mock('@/db', () => ({ getDb: vi.fn() }));
vi.mock('@/db/scheam', async () => import('@/db/scheam/managed/manual'));

function seedDatabase() {
  const stores = new Map<unknown, Record<string, unknown>[]>([
    [manualArticle, []],
    [manualCategory, []],
    [manualSettings, []]
  ]);
  const database = {
    transaction: async (callback: (tx: unknown) => unknown) => callback(database),
    select: () => ({ from: (table: unknown) => ({ where: () => stores.get(table) ?? [] }) }),
    insert: (table: unknown) => {
      const builder = {
        ignore: () => builder,
        values: (value: Record<string, unknown>) => {
          const rows = stores.get(table);
          if (!rows) throw new Error('Unexpected table');
          const duplicate = table === manualSettings && rows.length > 0;
          const id = rows.length + 1;
          if (!duplicate) rows.push({ ...structuredClone(value), id });
          return Object.assign(Promise.resolve([{ affectedRows: duplicate ? 0 : 1 }]), {
            $returningId: async () => [{ id }]
          });
        }
      };
      return builder;
    }
  };
  return { stores, database: database as unknown as Awaited<ReturnType<typeof getDb>> };
}
describe('manual initialization', () => {
  it('preserves all original URLs and step/tip content, and never overwrites on rerun', async () => {
    const { database, stores } = seedDatabase();
    expect(await seedManual(database)).toBe(true);
    expect(stores.get(manualCategory)).toHaveLength(6);
    expect(stores.get(manualArticle)).toHaveLength(8);
    const records = stores.get(manualArticle) ?? [];
    expect(records.map(row => row.slug)).toContain('getting-started');
    for (const row of records) {
      const draft = row.draft as { body: unknown };
      expect(richDocumentSchema.safeParse(draft.body).success).toBe(true);
    }
    const first = records[0];
    if (!first) throw new Error('Missing seed');
    first.draft = { edited: true };
    records.pop(); // A later rerun must not resurrect a deliberately removed seed article.
    expect(await seedManual(database)).toBe(false);
    expect(first.draft).toEqual({ edited: true });
    expect(records).toHaveLength(7);
  });
  it('ships an additive migration with restrictive category foreign keys', () => {
    const sql = readFileSync(resolve('drizzle/0007_manual_content.sql'), 'utf8');
    expect(sql.match(/CREATE TABLE/g)).toHaveLength(3);
    expect(sql.match(/ON DELETE restrict/g)).toHaveLength(2);
    expect(sql).toContain('manual_article_slug_unique');
    expect(sql).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/);
  });
});
