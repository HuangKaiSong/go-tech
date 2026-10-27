/** 上传入口的协议、安全和凭证校验，避免剪贴板路径绕过文件控件限制。 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clipboardImages, imageDescription, uploadManualImage, validateImageFile } from './image-upload';
vi.mock('@/hooks/use-auth', () => ({ getStoredToken: () => 'Bearer admin-token' }));
afterEach(() => vi.unstubAllGlobals());
const file = () => new File(['image-bytes'], '操作截圖.png', { type: 'image/png' });
describe('manual image upload', () => {
  it('posts multipart data with a single Bearer credential and validates the returned URL', async () => {
    const fetch = vi.fn(async () => Response.json({ code: '200', data: { url: '/uploads/manual.png' } }));
    vi.stubGlobal('fetch', fetch);
    const signal = new AbortController().signal;
    expect(await uploadManualImage(file(), signal)).toBe('/uploads/manual.png');
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBe(signal);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer admin-token');
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
    expect((init.body as FormData).get('file')).toHaveProperty('name', '操作截圖.png');
  });
  it.each([
    { code: 500, data: { url: '/should-not-insert.png' } },
    { code: 200, data: {} },
    { code: 200, data: { url: 'data:image/png;base64,aaaa' } }
  ])('rejects business failures and invalid image addresses', async result => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(result))
    );
    await expect(uploadManualImage(file(), new AbortController().signal)).rejects.toThrow();
  });
  it('rejects oversized, empty and unsupported files and provides a default description', () => {
    expect(validateImageFile(new File(['x'], 'image.svg', { type: 'image/svg+xml' }))).not.toBeNull();
    expect(validateImageFile(new File([], 'empty.png', { type: 'image/png' }))).not.toBeNull();
    const oversized = file();
    Object.defineProperty(oversized, 'size', { value: 10 * 1024 * 1024 + 1 });
    expect(validateImageFile(oversized)).not.toBeNull();
    expect(imageDescription(file())).toBe('操作截圖');
    expect(imageDescription(new File(['x'], '', { type: 'image/png' }))).toBe('貼上的圖片');
  });
  it('does not read the same clipboard file twice when both APIs supply it', () => {
    const image = file();
    const getAsFile = vi.fn(() => image);
    const data = { files: [image], items: [{ kind: 'file', getAsFile }] } as unknown as DataTransfer;
    expect(clipboardImages(data)).toEqual([image]);
    expect(getAsFile).not.toHaveBeenCalled();
  });
});
