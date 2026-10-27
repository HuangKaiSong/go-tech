import { type BlogAdminData, defaultBlogSettings } from '@go-tech/blog-content/model';
import { emptyDocument } from '@go-tech/manual-content/model';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blogRequest } from './api';
import BlogManagement from './index';
vi.mock('./api', () => ({ blogRequest: vi.fn() }));
vi.mock('../manual/rich-editor', () => ({
  RichEditor: ({ onPendingChange }: { onPendingChange: (count: number) => void }) => (
    <button onClick={() => onPendingChange(1)}>模擬正文圖片上傳</button>
  )
}));
const draft = {
  title: '現有文章',
  slug: 'existing',
  categoryId: 1,
  excerpt: '摘要',
  cover: '',
  coverAlt: '',
  body: emptyDocument,
  tags: [],
  displayDate: '2026-10-08',
  readMin: 6,
  isFeatured: true,
  sortOrder: 0
};
const category = { name: '租務', sortOrder: 0 };
const meta = {
  id: 1,
  version: 1,
  publishedVersion: 1,
  lockedSlug: null,
  publishedAt: '2026-10-21 01:00:00',
  updatedAt: '2026-10-21 01:00:00',
  updatedBy: 1,
  publicationState: 'published' as const
};
let data: BlogAdminData;
beforeEach(() => {
  vi.mocked(blogRequest).mockReset();
  data = {
    articles: [{ ...meta, draft, published: draft, lockedSlug: draft.slug }],
    categories: [{ ...meta, draft: category, published: category }],
    settings: [{ ...meta, draft: defaultBlogSettings, published: defaultBlogSettings }]
  };
  vi.mocked(blogRequest).mockImplementation(async command => {
    if (command) {
      const row = data.articles[0];
      if (!row) throw new Error('Missing fixture');
      if (command.action === 'save') row.draft = { ...row.draft, title: '新草稿' };
      if (command.action === 'publish') {
        row.published = structuredClone(row.draft);
        row.publishedVersion = row.version + 1;
      }
      row.version += 1;
    }
    return { ...structuredClone(data), savedId: 1 };
  });
});
afterEach(cleanup);
function setup() {
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/blog', element: <BlogManagement /> }], { initialEntries: ['/blog'] })}
    />
  );
}
describe('blog administration', () => {
  it('saves a draft separately, previews the authenticated draft and explicitly publishes', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /現有文章/ }));
    expect(((await screen.findByLabelText(/URL 標識/)) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: '刪除' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '新草稿' } });
    expect((screen.getByRole('button', { name: '發佈' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '儲存草稿' }));
    await waitFor(() => expect(data.articles[0]?.draft.title).toBe('新草稿'));
    expect(data.articles[0]?.published?.title).toBe('現有文章');
    fireEvent.click(await screen.findByRole('button', { name: '預覽' }));
    expect(await screen.findByRole('heading', { name: '新草稿' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '發佈' }));
    fireEvent.click(await screen.findByRole('button', { name: '確定' }));
    await waitFor(() => expect(data.articles[0]?.published?.title).toBe('新草稿'));
  });
  it('warns before discarding edits and blocks saves while images upload', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /現有文章/ }));
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '未儲存' } });
    fireEvent.click(screen.getByRole('button', { name: '分類' }));
    expect(await screen.findByText('尚有未儲存的修改，確定捨棄？')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect((screen.getByLabelText('標題') as HTMLInputElement).value).toBe('未儲存');
    fireEvent.click(screen.getByRole('button', { name: '模擬正文圖片上傳' }));
    expect((screen.getByRole('button', { name: '儲存草稿' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('keeps unsaved edits when the server reports a version conflict', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /現有文章/ }));
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '本地修改' } });
    vi.mocked(blogRequest).mockRejectedValueOnce(new Error('版本衝突'));
    fireEvent.click(screen.getByRole('button', { name: '儲存草稿' }));
    await waitFor(() =>
      expect((screen.getByRole('button', { name: '儲存草稿' }) as HTMLButtonElement).disabled).toBe(false)
    );
    expect((screen.getByLabelText('標題') as HTMLInputElement).value).toBe('本地修改');
  });
});
