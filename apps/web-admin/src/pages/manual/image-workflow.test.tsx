/** 使用真实编辑器覆盖自动插入、粘贴去重、异步位置映射及失败恢复。 */
import { type RichDocument, emptyDocument, richDocumentSchema } from '@go-tech/manual-content/model';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RichEditor } from './rich-editor';
vi.mock('@/hooks/use-auth', () => ({ getStoredToken: () => 'token' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const imageFile = (name = '截圖.png') => new File(['image-content'], name, { type: 'image/png' });
function pendingUpload() {
  let resolve: ((value: Response) => void) | undefined;
  const fetch = vi.fn(
    (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Promise<Response>(done => {
        resolve = done;
      })
  );
  vi.stubGlobal('fetch', fetch);
  return { fetch, finish: () => resolve?.(Response.json({ code: 200, data: { url: '/uploads/manual.png' } })) };
}
function setup(value: RichDocument = emptyDocument) {
  let latest = value;
  const pending = vi.fn();
  const view = render(
    <RichEditor
      value={value}
      disabled={false}
      onPendingChange={pending}
      onChange={body => {
        latest = body;
      }}
    />
  );
  return { ...view, pending, body: () => latest };
}
function chooseFile(file = imageFile()) {
  fireEvent.change(screen.getByLabelText('選擇圖片'), { target: { files: [file] } });
}
function pasteImage(file = imageFile()) {
  fireEvent.paste(screen.getByRole('textbox', { name: '指南正文' }), {
    clipboardData: {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }],
      getData: (type: string) => (type === 'text/html' ? '<img src="data:image/png;base64,aA==" />' : '')
    }
  });
}
describe('manual image workflow', () => {
  it('inserts a selected file automatically without a second image form or confirmation', async () => {
    const upload = pendingUpload();
    const view = setup();
    chooseFile();
    expect(view.pending).toHaveBeenLastCalledWith(1);
    expect(screen.queryByLabelText('圖片說明（選填）')).toBeNull();
    expect(JSON.stringify(view.body())).not.toContain('blob:');
    await act(async () => upload.finish());
    await waitFor(() => expect(view.pending).toHaveBeenLastCalledWith(0));
    expect(screen.getByAltText('截圖').getAttribute('src')).toBe('/uploads/manual.png');
    expect(richDocumentSchema.safeParse(view.body()).success).toBe(true);
    expect(screen.queryByLabelText('圖片上傳佇列')).toBeNull();
  });
  it('uploads pasted image bytes once even when HTML and clipboard items accompany the file', async () => {
    const upload = pendingUpload();
    const view = setup();
    pasteImage();
    expect(upload.fetch).toHaveBeenCalledTimes(1);
    await act(async () => upload.finish());
    await waitFor(() => expect(view.pending).toHaveBeenLastCalledWith(0));
    expect(screen.getAllByAltText('截圖')).toHaveLength(1);
    expect(JSON.stringify(view.body())).not.toContain('data:image');
  });
  it('keeps text pasted while an image upload is pending and maps the image placeholder', async () => {
    const upload = pendingUpload();
    const view = setup();
    pasteImage();
    fireEvent.paste(screen.getByRole('textbox', { name: '指南正文' }), {
      clipboardData: {
        files: [],
        items: [],
        getData: (type: string) => (type === 'text/plain' ? '上傳期間輸入的文字' : '')
      }
    });
    await act(async () => upload.finish());
    await waitFor(() => expect(view.pending).toHaveBeenLastCalledWith(0));
    const json = JSON.stringify(view.body());
    expect(json).toContain('上傳期間輸入的文字');
    expect(json).toContain('/uploads/manual.png');
  });
  it('retains the failed position for retry and removes the placeholder after success', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ code: 500 }))
      .mockResolvedValueOnce(Response.json({ code: 200, data: { url: '/uploads/retried.png' } }));
    vi.stubGlobal('fetch', fetch);
    const view = setup();
    chooseFile();
    fireEvent.click(await screen.findByRole('button', { name: '重試' }));
    await waitFor(() => expect(view.pending).toHaveBeenLastCalledWith(0));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByAltText('截圖').getAttribute('src')).toBe('/uploads/retried.png');
  });
  it('cancels uploads on demand and on unmount without inserting a late response', async () => {
    const upload = pendingUpload();
    const view = setup();
    chooseFile();
    const init = upload.fetch.mock.calls[0]?.[1] as RequestInit | undefined;
    fireEvent.click(screen.getByRole('button', { name: '取消上傳' }));
    expect(init?.signal?.aborted).toBe(true);
    await act(async () => upload.finish());
    expect(view.body().doc.content?.some(node => node.type === 'image')).toBe(false);
    chooseFile();
    const second = upload.fetch.mock.calls[1]?.[1] as RequestInit | undefined;
    view.unmount();
    expect(second?.signal?.aborted).toBe(true);
    await act(async () => upload.finish());
  });
  it('accepts web image HTML with an automatic description while preserving adjacent text', async () => {
    const view = setup();
    fireEvent.paste(screen.getByRole('textbox', { name: '指南正文' }), {
      clipboardData: {
        files: [],
        items: [],
        getData: (type: string) =>
          type === 'text/html'
            ? '<p>前面文字</p><img src="https://example.com/image.png" width="320"><p>後面文字</p>'
            : ''
      }
    });
    expect(JSON.stringify(view.body())).toContain('前面文字');
    expect(JSON.stringify(view.body())).toContain('後面文字');
    expect(richDocumentSchema.safeParse(view.body()).success).toBe(true);
    expect(screen.getByAltText('圖片').getAttribute('src')).toBe('https://example.com/image.png');
  });
});
