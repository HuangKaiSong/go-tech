/** 验证保存、预览、发布及未保存修改的确认流程，接口由测试替身提供。 */
import { type ManualAdminData, defaultManualSettings, emptyDocument } from '@go-tech/manual-content/model';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ManualManagement from './index';
vi.mock('@/hooks/use-auth', () => ({ getStoredToken: () => 'admin-token' }));
vi.mock('./rich-editor', () => ({ RichEditor: () => <div>可視化正文編輯器</div> }));
const meta = {
  version: 1,
  publishedVersion: 1,
  publishedAt: '2026-10-21 10:00:00',
  updatedAt: '2026-10-21 10:00:00',
  updatedBy: 7,
  lockedSlug: null
};
const category = { name: '開始使用', desc: '公司設定', icon: 'Rocket' as const, sortOrder: 0 };
const guide = {
  title: '首次登入',
  slug: 'getting-started',
  categoryId: 1,
  summary: '設定公司',
  sortOrder: 0,
  body: emptyDocument
};
let data: ManualAdminData;
let commands: Record<string, unknown>[];
let unauthorized: boolean;
beforeEach(() => {
  commands = [];
  unauthorized = false;
  data = {
    categories: [{ ...meta, id: 1, draft: category, published: category }],
    articles: [{ ...meta, lockedSlug: guide.slug, id: 1, draft: guide, published: guide }],
    settings: [{ ...meta, id: 1, draft: defaultManualSettings, published: defaultManualSettings }]
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      if (unauthorized) return Response.json({ code: 401, message: '登入已過期' }, { status: 401 });
      if (init.method === 'POST') {
        const command = JSON.parse(String(init.body)) as Record<string, unknown>;
        commands.push(command);
        const row = data.articles[0];
        if (!row) throw new Error('Missing fixture');
        if (command.action === 'save') row.draft = command.draft as typeof guide;
        if (command.action === 'publish') row.published = structuredClone(row.draft);
        row.version += 1;
        return Response.json({ code: 200, savedId: row.id, data });
      }
      return Response.json({ code: 200, data });
    })
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  const router = createMemoryRouter(
    [
      { path: '/manual', element: <ManualManagement /> },
      { path: '/other', element: <div>其他頁面</div> }
    ],
    { initialEntries: ['/manual'] }
  );
  render(<RouterProvider router={router} />);
  return router;
}
describe('manual management workflow', () => {
  it('saves drafts without publishing, previews saved content and explicitly publishes', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /首次登入/ }));
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '更新後的指南' } });
    expect((screen.getByRole('button', { name: '發佈' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '儲存草稿' }));
    await waitFor(() => expect(commands).toHaveLength(1));
    expect(commands[0]).toMatchObject({ action: 'save', kind: 'article', id: 1, version: 1 });
    expect(data.articles[0]?.published?.title).toBe('首次登入');
    await waitFor(() =>
      expect((screen.getByRole('button', { name: '預覽已儲存草稿' }) as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: '預覽已儲存草稿' }));
    expect(await screen.findByRole('heading', { name: '更新後的指南' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '發佈' }));
    fireEvent.click(await screen.findByRole('button', { name: '確定' }));
    await waitFor(() => expect(commands).toHaveLength(2));
    expect(commands[1]).toMatchObject({ action: 'publish', version: 2 });
    expect(data.articles[0]?.published?.title).toBe('更新後的指南');
  });
  it('warns before discarding edits and allows cancelling', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /首次登入/ }));
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '未儲存修改' } });
    fireEvent.click(screen.getByRole('button', { name: '主題' }));
    expect(await screen.findByText('尚有未儲存的修改，確定捨棄？')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect((screen.getByLabelText('標題') as HTMLInputElement).value).toBe('未儲存修改');
    expect(commands).toHaveLength(0);
  });
  it('shows failed authenticated loads and supports retry', async () => {
    unauthorized = true;
    setup();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', '登入已過期');
    unauthorized = false;
    fireEvent.click(screen.getByRole('button', { name: '重新載入' }));
    expect(await screen.findByRole('button', { name: /首次登入/ })).toBeTruthy();
  });
  it('blocks route navigation until unsaved edits are explicitly discarded', async () => {
    const router = setup();
    fireEvent.click(await screen.findByRole('button', { name: /首次登入/ }));
    fireEvent.change(await screen.findByLabelText('標題'), { target: { value: '未儲存修改' } });
    await act(async () => {
      await router.navigate('/other');
    });
    expect(await screen.findByText('尚有未儲存的修改，確定離開？')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '取消' }));
    });
    expect(router.state.location.pathname).toBe('/manual');
    await act(async () => {
      await router.navigate('/other');
    });
    fireEvent.click(await screen.findByRole('button', { name: '確定' }));
    expect(await screen.findByText('其他頁面')).toBeTruthy();
  });
});
