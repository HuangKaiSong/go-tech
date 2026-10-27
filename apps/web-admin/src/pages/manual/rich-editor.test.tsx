/** 使用真实编辑器验证图片安全约束及切换指南时正文正确重建。 */
import {
  type ManualAdminData,
  type RichDocument,
  emptyDocument,
  richDocumentSchema
} from '@go-tech/manual-content/model';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditPanel } from './edit-panel';
import { RichEditor } from './rich-editor';
import { makeSelection } from './selection';
import type { ManualController } from './use-manual';
const document = (text: string): RichDocument => ({
  version: 1,
  doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
});
afterEach(cleanup);
describe('manual visual editor', () => {
  it('inserts a URL image with a safe source and an optional description', () => {
    let latest: RichDocument = emptyDocument;
    render(
      <RichEditor
        value={emptyDocument}
        disabled={false}
        onChange={body => {
          latest = body;
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '使用圖片網址' }));
    const insert = screen.getByRole('button', { name: '插入' }) as HTMLButtonElement;
    // oxlint-disable-next-line eslint/no-script-url -- Deliberately unsafe regression input.
    fireEvent.change(screen.getByLabelText('圖片網址'), { target: { value: 'javascript:alert(1)' } });
    fireEvent.change(screen.getByLabelText('圖片說明（選填）'), { target: { value: '登入畫面' } });
    expect(insert.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('圖片網址'), { target: { value: 'https://example.com/manual.png' } });
    expect(insert.disabled).toBe(false);
    fireEvent.click(insert);
    expect(richDocumentSchema.safeParse(latest).success).toBe(true);
    expect(JSON.stringify(latest)).toContain('登入畫面');
  });
  it('keeps icon actions accessible and reflects the selected text format', () => {
    render(<RichEditor value={document('正文內容')} disabled={false} onChange={() => {}} />);
    const bold = screen.getByRole('button', { name: '粗體' });
    expect(bold.textContent).toBe('');
    expect(bold.querySelector('svg')).not.toBeNull();
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: '新增表格行' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '刪除表格列' })).toBeTruthy();
  });
  it('replaces the editor document when selecting a different guide', () => {
    const guide = {
      categoryId: 1,
      slug: 'first',
      title: '第一篇',
      summary: '',
      sortOrder: 0,
      body: document('第一篇正文')
    };
    const metadata = {
      id: 1,
      version: 1,
      draft: guide,
      published: null,
      publishedVersion: null,
      publishedAt: null,
      updatedAt: '',
      updatedBy: 1,
      lockedSlug: null
    };
    const data: ManualAdminData = {
      categories: [],
      settings: [],
      articles: [metadata, { ...metadata, id: 2, draft: { ...guide, slug: 'second', body: document('第二篇正文') } }]
    };
    const controller: ManualController = {
      data,
      busy: false,
      imageUploads: 0,
      setImageUploads: vi.fn(),
      dirty: false,
      error: '',
      preview: false,
      tab: 'article',
      confirmation: <span />,
      selection: makeSelection('article', data, data.articles[0]),
      setSelection: vi.fn(),
      setPreview: vi.fn(),
      choose: vi.fn(async () => {}),
      changeTab: vi.fn(async () => {}),
      perform: vi.fn(async () => {}),
      reload: vi.fn(async () => {}),
      showPreview: vi.fn(async () => {})
    };
    const view = render(<EditPanel controller={controller} />);
    expect(screen.getByRole('textbox', { name: '指南正文' }).textContent).toBe('第一篇正文');
    view.rerender(
      <EditPanel controller={{ ...controller, selection: makeSelection('article', data, data.articles[1]) }} />
    );
    expect(screen.getByRole('textbox', { name: '指南正文' }).textContent).toBe('第二篇正文');
  });
});
