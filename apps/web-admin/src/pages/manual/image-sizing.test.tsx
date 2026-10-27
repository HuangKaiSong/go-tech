/** 通过真实节点视图验证像素调整、拖拽和撤销都写回正文，避免仅修改临时 DOM 样式。 */
import { type RichDocument, richDocumentSchema } from '@go-tech/manual-content/model';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RichEditor } from './rich-editor';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
let imageTop = 300;
beforeEach(() => {
  imageTop = 300;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function bounds(this: HTMLElement) {
    const top = this instanceof HTMLImageElement ? imageTop : 0;
    const height = this instanceof HTMLFieldSetElement ? 180 : 200;
    return {
      x: 200,
      y: top,
      left: 200,
      top,
      right: 840,
      bottom: top ? top + height : 768,
      width: 640,
      height,
      toJSON: () => ({})
    };
  });
});
function setup() {
  let body: RichDocument = {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'image', attrs: { src: '/screenshot.png', alt: '操作截圖', width: 640, height: 480 } }]
    }
  };
  const view = render(
    <RichEditor
      disabled={false}
      value={body}
      onChange={next => {
        body = next;
      }}
    />
  );
  const image = screen.getByAltText('操作截圖') as HTMLImageElement;
  fireEvent.load(image);
  return {
    ...view,
    image,
    attrs: () => body.doc.content?.find(node => node.type === 'image')?.attrs,
    body: () => body
  };
}
describe('manual image sizing', () => {
  it('keeps controls near the selected bottom image on nested scrolling and hides them outside the viewport', () => {
    imageTop = 500;
    const view = setup();
    const panel = screen.getByRole('group', { name: '圖片設定' });
    expect(view.container.contains(panel)).toBe(false);
    expect(panel.style.top).toBe('308px');
    imageTop = 350;
    fireEvent.scroll(view.container);
    expect(panel.style.top).toBe('562px');
    imageTop = 1000;
    fireEvent.scroll(view.container);
    expect(panel.style.visibility).toBe('hidden');
  });

  it('keeps ratio for pixel edits and synchronizes reset/undo with the actual image', async () => {
    const view = setup();
    const input = screen.getByLabelText('圖片寬度');
    fireEvent.change(input, { target: { value: '320' } });
    fireEvent.blur(input);
    await waitFor(() => expect(view.attrs()).toMatchObject({ width: 320, height: 240 }));
    expect(view.image.style.width).toBe('320px');
    fireEvent.click(screen.getByRole('button', { name: '原始尺寸' }));
    expect(view.attrs()).toMatchObject({ width: null, height: null });
    expect(view.image.style.width).toBe('');
    fireEvent.click(screen.getByRole('button', { name: '撤銷' }));
    expect(view.attrs()).toMatchObject({ width: 320, height: 240 });
    expect(view.image.style.width).toBe('320px');
    expect(richDocumentSchema.safeParse(view.body()).success).toBe(true);
  });
  it('commits handle dragging as image dimensions that survive document serialization', () => {
    const view = setup();
    Object.defineProperty(view.image, 'offsetWidth', {
      configurable: true,
      get: () => Number.parseFloat(view.image.style.width) || 640
    });
    Object.defineProperty(view.image, 'offsetHeight', {
      configurable: true,
      get: () => ((Number.parseFloat(view.image.style.width) || 640) * 3) / 4
    });
    const handle = view.container.querySelector('[data-resize-handle="bottom-right"]');
    if (!handle) throw new Error('Missing resize handle');
    fireEvent.mouseDown(handle, { clientX: 640, clientY: 480 });
    fireEvent.mouseMove(globalThis.document, { clientX: 320, clientY: 240 });
    fireEvent.mouseUp(globalThis.document);
    expect(view.attrs()).toMatchObject({ width: 320, height: 240 });
    expect(richDocumentSchema.parse(view.body()).doc.content?.[0]?.attrs?.width).toBe(320);
  });
});
