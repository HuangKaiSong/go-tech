/** 验证富文本契约的 URL、属性、规模限制，以及同名标题的目录锚点。 */
import { describe, expect, it } from 'vitest';
import { type RichNode, emptyDocument, headingEntries, richDocumentSchema, safeManualUrl } from '../src/model';

const document = (content: RichNode[]) => ({ version: 1, doc: { type: 'doc', content } });
describe('manual content boundary', () => {
  it.each([
    // oxlint-disable-next-line eslint/no-script-url -- Deliberately unsafe regression input.
    'javascript:alert(1)',
    'data:image/svg+xml,<svg/>',
    '//evil.example',
    '/\\evil.example',
    'https://user:password@example.com',
    'https://example.com/\npath'
  ])('rejects unsafe URL %s', value => {
    expect(safeManualUrl(value)).toBe(false);
    expect(
      richDocumentSchema.safeParse(
        document([
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: value } }] }]
          }
        ])
      ).success
    ).toBe(false);
  });
  it('requires image alt text and rejects HTML/unknown nodes/attributes', () => {
    expect(
      richDocumentSchema.safeParse(
        document([{ type: 'image', attrs: { src: 'https://example.com/image.png', alt: '' } }])
      ).success
    ).toBe(false);
    expect(
      richDocumentSchema.safeParse(
        document([{ type: 'image', attrs: { src: '/image.png', alt: '相片', onerror: 'alert(1)' } }])
      ).success
    ).toBe(false);
    expect(richDocumentSchema.safeParse({ version: 1, doc: { type: 'html', text: '<script />' } }).success).toBe(false);
  });
  it('supports tables, tips and image descriptions', () => {
    const result = richDocumentSchema.safeParse(
      document([
        { type: 'image', attrs: { src: '/images/manual.png', alt: '操作截圖' } },
        { type: 'tip', content: [{ type: 'paragraph', content: [{ type: 'text', text: '提示' }] }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  attrs: { rowspan: 1, colspan: 1, colwidth: null },
                  content: [{ type: 'paragraph' }]
                }
              ]
            }
          ]
        }
      ])
    );
    expect(result.success).toBe(true);
  });
  it('gives repeated headings unique stable anchors', () => {
    const body = richDocumentSchema.parse(
      document(
        [2, 3, 2].map(level => ({ type: 'heading', attrs: { level }, content: [{ type: 'text', text: '同名標題' }] }))
      )
    );
    expect(headingEntries(body).map(entry => entry.id)).toEqual([
      'manual-heading-0',
      'manual-heading-1',
      'manual-heading-2'
    ]);
  });
  it('bounds depth before recursive parsing', () => {
    let node: RichNode = { type: 'paragraph' };
    for (let i = 0; i < 300; i += 1) node = { type: 'blockquote', content: [node] };
    expect(() => richDocumentSchema.safeParse(document([node]))).not.toThrow();
    expect(richDocumentSchema.safeParse(document([node])).success).toBe(false);
    expect(richDocumentSchema.safeParse(emptyDocument).success).toBe(true);
  });
});
