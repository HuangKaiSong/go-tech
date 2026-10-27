import { emptyDocument } from '@go-tech/manual-content/model';
import { describe, expect, it } from 'vitest';
import { articleSchema, normalizeTag, querySchema, summarySchema } from '../src/model';
const article = {
  title: '文章',
  slug: 'article-1',
  categoryId: 1,
  excerpt: '摘要',
  cover: '',
  coverAlt: '',
  body: emptyDocument,
  tags: [],
  displayDate: '2026-10-08',
  readMin: 6,
  isFeatured: false,
  sortOrder: 0
};
describe('blog contract', () => {
  it('normalizes duplicate tags without stripping display text', () => {
    const parsed = articleSchema.parse({ ...article, tags: [' ＧＯ－ＨＲ ', 'go-hr', '租務'] });
    expect(parsed.tags).toEqual(['go-hr', '租務']);
    expect(normalizeTag(' ＨＲ ')).toBe('hr');
  });
  it('requires valid dates, stable slugs and safe accessible covers', () => {
    for (const patch of [
      { displayDate: '2026-02-30' },
      { slug: '../draft' },
      { cover: ['javascript', 'alert(1)'].join(':'), coverAlt: '圖片' },
      { cover: '/image.jpg', coverAlt: '' },
      { readMin: 0 }
    ]) {
      expect(articleSchema.safeParse({ ...article, ...patch }).success).toBe(false);
    }
  });
  it('rejects executable rich-text nodes using the shared validator', () => {
    expect(
      articleSchema.safeParse({
        ...article,
        body: { version: 1, doc: { type: 'doc', content: [{ type: 'script', text: 'bad' }] } }
      }).success
    ).toBe(false);
  });
  it('validates and bounds public query inputs', () => {
    expect(querySchema.parse({ page: '2', q: ' 印花稅 ', categoryId: '3' })).toEqual({
      page: 2,
      q: '印花稅',
      categoryId: 3
    });
    for (const input of [{ page: 0 }, { categoryId: 'NaN' }, { q: 'x'.repeat(51) }, { page: 1.2 }])
      expect(querySchema.safeParse(input).success).toBe(false);
  });
  it('does not expose body or draft fields in summaries', () => {
    expect(summarySchema.safeParse({ ...article, id: 1, category: '分類', draft: 'secret' }).success).toBe(false);
  });
});
