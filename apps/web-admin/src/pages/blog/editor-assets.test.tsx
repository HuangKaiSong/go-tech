import { richDocumentSchema } from '@go-tech/manual-content/model';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RichEditor } from '../manual/rich-editor';
afterEach(cleanup);
it('resolves site-relative editor images through H5 without rewriting the saved document', async () => {
  const body = richDocumentSchema.parse({
    version: 1,
    doc: {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: '/images/blog/example.jpg', alt: '博客配圖', width: 320, height: 240 } },
        { type: 'paragraph' }
      ]
    }
  });
  render(
    <RichEditor
      value={body}
      disabled={false}
      onChange={vi.fn()}
      imageBaseUrl="/h5-hook"
      label="文章正文"
      numberedHeadings={false}
    />
  );
  fireEvent.load(screen.getByAltText('博客配圖'));
  await waitFor(() =>
    expect(screen.getByRole('img', { name: '博客配圖' }).getAttribute('src')).toBe('/h5-hook/images/blog/example.jpg')
  );
  expect(body.doc.content?.[0]?.attrs?.src).toBe('/images/blog/example.jpg');
  expect(screen.getByRole('textbox', { name: '文章正文' })).toBeTruthy();
});
