/** 保留真实 SQL 条件并替换数据库执行，验证版本锁、发布、URL 固定与关联删除限制。 */
import {
  type ManualArticle,
  type ManualRecord,
  defaultManualSettings,
  emptyDocument
} from '@go-tech/manual-content/model';
import { type SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/db';
import { mutateManual } from './service';
vi.mock('@/db', () => ({ getDb: vi.fn() }));
vi.mock('@/db/scheam', async () => import('@/db/scheam/managed/manual'));

let queued: unknown[][];
const updates: { payload: Record<string, unknown>; where?: SQL }[] = [];
const deletes = vi.fn();
const locks = vi.fn();
const select = vi.fn(() => ({
  from: () => {
    const rows = queued.shift() ?? [];
    const promise = Promise.resolve(rows);
    const builder = Object.assign(promise, {
      where: (_condition: SQL) => builder,
      for: (mode: string) => {
        locks(mode);
        return promise;
      },
      limit: () => promise
    });
    return builder;
  }
}));
const update = vi.fn(() => ({
  set: (payload: Record<string, unknown>) => ({
    where: (where: SQL) => {
      updates.push({ payload, where });
      return Promise.resolve();
    }
  })
}));
const remove = vi.fn(() => ({ where: deletes }));
const article: ManualArticle = {
  categoryId: 1,
  slug: 'getting-started',
  title: '指南',
  summary: '',
  sortOrder: 0,
  body: emptyDocument
};
const record: ManualRecord<ManualArticle> = {
  id: 1,
  version: 3,
  draft: article,
  published: article,
  lockedSlug: article.slug,
  publishedVersion: 2,
  publishedAt: '2026-10-21 01:00:00',
  updatedAt: '2026-10-21 01:00:00',
  updatedBy: 1
};
const category = { name: '主題', desc: '', icon: 'Rocket', sortOrder: 0 };
beforeEach(() => {
  vi.clearAllMocks();
  updates.length = 0;
  queued = [[{ id: 1 }], [structuredClone(record)], [{ id: 1 }], [{ id: 1 }], [{ published: category }]];
  const db = {
    select,
    update,
    delete: remove,
    transaction: async (callback: (tx: unknown) => unknown) => callback(db)
  };
  vi.mocked(getDb).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof getDb>>);
});
describe('manual mutations', () => {
  it('saves a draft without touching the online snapshot and checks version in SQL', async () => {
    await mutateManual(
      { kind: 'article', action: 'save', id: 1, version: 3, draft: { ...article, title: '新草稿' } },
      9
    );
    expect(updates[0]?.payload).toMatchObject({ draft: { title: '新草稿' }, updatedBy: 9, version: 4 });
    expect(updates[0]?.payload).not.toHaveProperty('published');
    const condition = updates[0]?.where;
    if (!condition) throw new Error('Missing version condition');
    expect(new MySqlDialect().sqlToQuery(condition).params).toEqual([1, 3]);
    expect(locks).toHaveBeenCalledWith('update');
  });
  it('rejects stale versions before performing any write', async () => {
    await expect(mutateManual({ kind: 'article', action: 'publish', id: 1, version: 2 }, 9)).rejects.toMatchObject({
      status: 409
    });
    expect(update).not.toHaveBeenCalled();
  });
  it('locks URLs even after taking a guide down', async () => {
    if (queued[1]?.[0]) queued[1][0] = { ...record, published: null };
    await expect(
      mutateManual({ kind: 'article', action: 'save', id: 1, version: 3, draft: { ...article, slug: 'changed' } }, 9)
    ).rejects.toMatchObject({ status: 409 });
    expect(update).not.toHaveBeenCalled();
  });
  it('publishes the saved snapshot and locks its slug', async () => {
    await mutateManual({ kind: 'article', action: 'publish', id: 1, version: 3 }, 9);
    expect(updates[0]?.payload).toMatchObject({
      published: article,
      lockedSlug: article.slug,
      publishedCategoryId: 1,
      publishedVersion: 4
    });
  });
  it('rejects duplicate URL identifiers', async () => {
    queued[3] = [{ id: 99 }];
    await expect(
      mutateManual({ kind: 'article', action: 'save', id: 1, version: 3, draft: article }, 9)
    ).rejects.toMatchObject({ status: 409 });
    expect(update).not.toHaveBeenCalled();
  });
  it('requires a published category when publishing an article', async () => {
    queued[4] = [{ published: null }];
    await expect(mutateManual({ kind: 'article', action: 'publish', id: 1, version: 3 }, 9)).rejects.toThrow(
      '請先發佈'
    );
  });
  it('prevents deleting a category referenced by draft or published guides', async () => {
    queued = [[{ id: 1 }], [{ ...record, draft: category }], [{ id: 8 }]];
    await expect(mutateManual({ kind: 'category', action: 'delete', id: 1, version: 3 }, 9)).rejects.toMatchObject({
      status: 409
    });
    expect(deletes).not.toHaveBeenCalled();
  });
  it('cannot delete or unpublish the home settings', async () => {
    await expect(
      mutateManual({ kind: 'settings', action: 'delete', id: 1, version: 1, draft: defaultManualSettings }, 9)
    ).rejects.toMatchObject({ status: 400 });
    expect(getDb).not.toHaveBeenCalled();
  });
  it('removes the public snapshot when taking a guide down', async () => {
    await mutateManual({ kind: 'article', action: 'unpublish', id: 1, version: 3 }, 9);
    expect(updates[0]?.payload).toMatchObject({ published: null, publishedCategoryId: null });
  });
});
