import { type BlogList, defaultBlogSettings } from '@go-tech/blog-content/model';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { useBlogList } from './use-blog-list';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));
vi.mock('@/lib/client-http/client-fetch', () => ({ clientFetch: vi.fn() }));
const initial: BlogList = {
  settings: defaultBlogSettings,
  categories: [{ id: 1, name: '租務', sortOrder: 0 }],
  articles: [
    {
      id: 1,
      category: '租務',
      title: '原文章',
      slug: 'article-1',
      categoryId: 1,
      excerpt: '',
      cover: '',
      coverAlt: '',
      tags: [],
      displayDate: '2026-10-08',
      readMin: 6,
      isFeatured: true,
      sortOrder: 0
    }
  ],
  query: { q: '', page: 1 },
  page: 1,
  pageSize: 12,
  total: 25
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(clientFetch).mockReset();
  window.history.replaceState(null, '', '/blog?product=pms');
});
afterEach(() => vi.useRealTimers());
describe('public blog requests', () => {
  it('renders server results, debounces by 200ms, resets page and keeps unrelated URL state', async () => {
    const hook = renderHook(() => useBlogList(initial));
    expect(clientFetch).not.toHaveBeenCalled();
    act(() => hook.result.current.search('印花'));
    await act(() => vi.advanceTimersByTimeAsync(199));
    expect(window.location.search).not.toContain('q=');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(new URLSearchParams(window.location.search).get('q')).toBe('印花');
    expect(new URLSearchParams(window.location.search).get('product')).toBe('pms');
    vi.mocked(clientFetch).mockResolvedValue(
      Response.json({ data: { ...initial, articles: [], query: { q: '印花', page: 1 } } })
    );
    await act(async () => hook.rerender());
    expect(clientFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/blog?'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      { feedback: 'silent' }
    );
    expect(hook.result.current.data.articles).toHaveLength(0);
    act(() => hook.result.current.selectCategory(1));
    expect(new URLSearchParams(window.location.search).get('page')).toBeNull();
    expect(new URLSearchParams(window.location.search).get('categoryId')).toBe('1');
  });
  it('cancels stale requests and refuses late responses after a new page is selected', async () => {
    const hook = renderHook(() => useBlogList(initial));
    let resolveOld: ((response: Response) => void) | undefined;
    vi.mocked(clientFetch).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        })
    );
    act(() => hook.result.current.selectPage(2));
    await act(async () => hook.rerender());
    const signal = vi.mocked(clientFetch).mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(false);
    vi.mocked(clientFetch).mockResolvedValueOnce(
      Response.json({ data: { ...initial, page: 3, query: { q: '', page: 3 }, articles: [] } })
    );
    act(() => hook.result.current.selectPage(3));
    await act(async () => hook.rerender());
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolveOld?.(Response.json({ data: { ...initial, page: 2, query: { q: '', page: 2 } } }));
    });
    expect(hook.result.current.data.page).toBe(3);
    expect(hook.result.current.data.articles).toHaveLength(0);
  });
  it('keeps content on errors, retries and restores URL filters on history navigation', async () => {
    const hook = renderHook(() => useBlogList(initial));
    vi.mocked(clientFetch).mockRejectedValueOnce(new Error('暫時無法載入'));
    act(() => hook.result.current.selectPage(2));
    await act(async () => hook.rerender());
    expect(hook.result.current.error).toBe('暫時無法載入');
    expect(hook.result.current.data.articles[0]?.title).toBe('原文章');
    vi.mocked(clientFetch).mockResolvedValueOnce(
      Response.json({ data: { ...initial, page: 2, query: { q: '', page: 2 } } })
    );
    await act(async () => hook.result.current.retry());
    expect(hook.result.current.error).toBe('');
    act(() => window.history.replaceState(null, '', '/blog?product=pms&q=租務&categoryId=1'));
    vi.mocked(clientFetch).mockResolvedValueOnce(
      Response.json({ data: { ...initial, query: { q: '租務', categoryId: 1, page: 1 } } })
    );
    await act(async () => hook.rerender());
    expect(hook.result.current.input).toBe('租務');
    expect(hook.result.current.query.categoryId).toBe(1);
  });
});
