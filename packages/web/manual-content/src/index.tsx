import { type ReactNode, createElement } from 'react';
import {
  type RichDocument,
  type RichNode,
  contentImageUrl,
  headingEntries,
  imageDimension,
  safeManualUrl
} from './model';
export * from './model';

/** 前台及后台预览共用的 React 渲染器；仅映射受控节点，不插入原始 HTML。 */
export function ManualBody({
  body,
  imageBaseUrl = '',
  numberedHeadings = true
}: {
  body: RichDocument;
  imageBaseUrl?: string;
  numberedHeadings?: boolean;
}) {
  let heading = 0;
  const render = (node: RichNode, index: number): ReactNode => {
    const children = node.content?.map(render);
    const props = { key: index };
    if (node.type === 'text') return renderText(node, index);
    if (node.type === 'heading') {
      const id = `manual-heading-${heading}`;
      heading += 1;
      return createElement(node.attrs?.level === 3 ? 'h3' : 'h2', { ...props, id }, children);
    }
    return renderBlock(node, children, { index, imageBaseUrl });
  };
  return (
    <div className="manual-rich-text" data-numbered-headings={numberedHeadings}>
      {render(body.doc, 0)}
    </div>
  );
}
/** 通过 React 自动转义文本，格式标记只能生成固定标签，链接再次检查目标地址。 */
function renderText(node: RichNode, index: number): ReactNode {
  let text: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === 'link') {
      const href = mark.attrs?.href;
      if (typeof href === 'string' && safeManualUrl(href))
        text = (
          <a href={href} rel="noopener noreferrer">
            {text}
          </a>
        );
    } else {
      const tag = { bold: 'strong', italic: 'em', strike: 's', underline: 'u' }[mark.type];
      text = createElement(tag, {}, text);
    }
  }
  return <span key={index}>{text}</span>;
}
/** 将白名单块节点映射为语义化元素；未知节点不渲染，表格使用独立横向滚动容器。 */
function renderBlock(
  node: RichNode,
  children: ReactNode,
  { imageBaseUrl, index }: { imageBaseUrl: string; index: number }
): ReactNode {
  const props = { key: index };
  if (node.type === 'image') return renderImage(node, index, imageBaseUrl);
  if (node.type === 'hardBreak') return <br key={index} />;
  if (node.type === 'horizontalRule') return <hr key={index} />;
  if (node.type === 'orderedList')
    return (
      <ol key={index} start={Number(node.attrs?.start ?? 1)}>
        {children}
      </ol>
    );
  if (node.type === 'tip')
    return (
      <aside key={index} className="manual-tip">
        {children}
      </aside>
    );
  if (node.type === 'table')
    return (
      <div key={index} className="manual-table">
        <table>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  if (node.type === 'tableCell' || node.type === 'tableHeader') return renderCell(node, children, index);
  const tags = {
    doc: 'div',
    paragraph: 'p',
    bulletList: 'ul',
    listItem: 'li',
    blockquote: 'blockquote',
    tableRow: 'tr'
  } as const;
  const tag = tags[node.type as keyof typeof tags];
  return tag ? createElement(tag, props, children) : null;
}

/** 使用与正文相同的顺序锚点生成目录，没有标题时不显示空目录。 */
export function ManualContents({ body }: { body: RichDocument }) {
  const entries = headingEntries(body);
  if (!entries.length) return null;
  return (
    <nav aria-label="本頁內容" className="manual-contents">
      <p>本頁內容</p>
      <ol>
        {entries.map(entry => (
          <li key={entry.id} className={entry.level === 3 ? 'manual-subheading' : ''}>
            <a href={`#${entry.id}`}>{entry.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 只透传已支持的表格跨度，不将持久化属性整体展开到 DOM。 */
function renderCell(node: RichNode, children: ReactNode, index: number): ReactNode {
  return createElement(
    node.type === 'tableCell' ? 'td' : 'th',
    { key: index, colSpan: Number(node.attrs?.colspan ?? 1), rowSpan: Number(node.attrs?.rowspan ?? 1) },
    children
  );
}

/** 只输出经过校验的像素尺寸；共享响应式样式确保窄屏仍按比例缩小。 */
function renderImage(node: RichNode, index: number, imageBaseUrl = ''): ReactNode {
  const src = node.attrs?.src;
  if (typeof src !== 'string' || !safeManualUrl(src, true)) return null;
  return (
    <img
      key={index}
      src={contentImageUrl(src, imageBaseUrl)}
      alt={String(node.attrs?.alt ?? '')}
      width={imageDimension(node.attrs?.width)}
      height={imageDimension(node.attrs?.height)}
      loading="lazy"
    />
  );
}
