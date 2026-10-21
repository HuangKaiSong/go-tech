/** 验证公开投影只使用发布快照，草稿修改和隐藏主题不会泄露到前台。 */
import {
  type ManualAdminData,
  type ManualRecord,
  defaultManualSettings,
  emptyDocument
} from '@go-tech/manual-content/model';
import { describe, expect, it } from 'vitest';
import { publishedManual } from './publication';

function row<T>(id: number, draft: T, published: T | null): ManualRecord<T> {
  return {
    id,
    version: 2,
    draft,
    published,
    publishedVersion: 1,
    publishedAt: '2026-10-21 10:00:00',
    updatedAt: '2026-10-21 10:00:00',
    updatedBy: 1,
    lockedSlug: null
  };
}
const category = { name: '已發佈主題', desc: '', icon: 'Rocket' as const, sortOrder: 0 };
const article = {
  title: '已發佈指南',
  summary: '',
  slug: 'existing-guide',
  categoryId: 1,
  sortOrder: 0,
  body: emptyDocument
};
function fixture(): ManualAdminData {
  return {
    categories: [row(1, { ...category, name: '秘密草稿主題' }, category), row(2, category, null)],
    articles: [
      row(1, { ...article, title: '秘密草稿指南', categoryId: 2 }, article),
      row(2, { ...article, slug: 'unpublished' }, null),
      row(3, { ...article, slug: 'hidden', categoryId: 2 }, { ...article, slug: 'hidden', categoryId: 2 })
    ],
    settings: [row(1, { ...defaultManualSettings, title: '秘密設定' }, defaultManualSettings)]
  };
}
describe('manual published snapshots', () => {
  it('excludes all draft fields and uses published category assignment', () => {
    const data = publishedManual(fixture());
    expect(data.categories).toHaveLength(1);
    expect(data.articles.map(item => item.slug)).toEqual(['existing-guide']);
    expect(JSON.stringify(data)).not.toContain('秘密');
    expect(data.articles[0]?.categoryId).toBe(1);
  });
  it('hides article detail/list when its published category is taken down', () => {
    const data = fixture();
    if (data.categories[0]) data.categories[0].published = null;
    expect(publishedManual(data).articles).toEqual([]);
  });
  it('does not fall back to hardcoded content when settings are missing', () => {
    expect(() => publishedManual({ ...fixture(), settings: [] })).toThrow();
  });
});
