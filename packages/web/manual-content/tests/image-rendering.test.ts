/** 图片尺寸必须在保存校验及前台渲染中同时生效，拒绝样式字符串和超大数值。 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ManualBody } from '../src/index';
import { richDocumentSchema } from '../src/model';
const image = (width: unknown, height: unknown = 240) => ({
  version: 1,
  doc: { type: 'doc', content: [{ type: 'image', attrs: { src: '/manual.png', alt: '操作畫面', width, height } }] }
});
describe('manual image dimensions', () => {
  it('renders persisted dimensions in the shared public/preview renderer', () => {
    const body = richDocumentSchema.parse(image(320));
    const html = renderToStaticMarkup(createElement(ManualBody, { body }));
    expect(html).toContain('width="320"');
    expect(html).toContain('height="240"');
    expect(html).toContain('alt="操作畫面"');
  });
  it.each([0, -1, 1.5, 10_001, '100%;position:fixed', Number.POSITIVE_INFINITY])(
    'rejects invalid dimensions %s',
    value => {
      expect(richDocumentSchema.safeParse(image(value)).success).toBe(false);
      expect(richDocumentSchema.safeParse(image(320, value)).success).toBe(false);
    }
  );
  it('allows old images with automatic dimensions', () => {
    expect(richDocumentSchema.safeParse(image(null, null)).success).toBe(true);
  });
});
