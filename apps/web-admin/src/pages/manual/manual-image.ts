import { contentImageUrl, imageDimension, manualImageSizeLimit, safeManualUrl } from '@go-tech/manual-content/model';
import { ResizableNodeView } from '@tiptap/core';
import { Image, type ImageOptions } from '@tiptap/extension-image';
import { setImageAttributes } from './image-attributes';

/** HTML 图片属性不直接信任字符串尺寸；不合法的数值回退为图片自然尺寸。 */
function htmlDimension(element: HTMLElement, name: 'height' | 'width') {
  const raw = element.getAttribute(name) || element.style[name];
  if (!raw || !/^\d+(?:px)?$/.test(raw)) return null;
  return imageDimension(Number(raw.replace(/px$/, ''))) ?? null;
}

/** 复用 Tiptap 自带等比例拖拽，粘贴网页图片时补齐说明并过滤不安全的 src。 */
export const ManualImage = Image.extend<ImageOptions & { imageBaseUrl: string }>({
  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      resize: false,
      ...this.parent?.(),
      imageBaseUrl: ''
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: { default: '圖片', parseHTML: element => element.getAttribute('alt')?.trim().slice(0, 500) || '圖片' },
      width: { default: null, parseHTML: element => htmlDimension(element, 'width') },
      height: { default: null, parseHTML: element => htmlDimension(element, 'height') }
    };
  },
  addNodeView() {
    const parent = this.parent?.();
    if (!parent) return null;
    return props => {
      const view = parent(props);
      if (!(view instanceof ResizableNodeView)) return view;
      const element = view.element;
      const syncSource = (source: unknown) => {
        if (typeof source === 'string') element.setAttribute('src', contentImageUrl(source, this.options.imageBaseUrl));
      };
      syncSource(props.node.attrs.src);
      const contentWidth = props.view.dom.clientWidth;
      view.maxSize = {
        width: Math.min(contentWidth || manualImageSizeLimit, manualImageSizeLimit),
        height: manualImageSizeLimit
      };
      // 库默认只同步拖拽样式；补上属性变化、撤销及恢复原尺寸后的视图同步。
      const update = view.update.bind(view);
      view.update = (node, decorations, inner) => {
        const result = update(node, decorations, inner);
        if (result) {
          syncSource(node.attrs.src);
          const width = imageDimension(node.attrs.width);
          element.style.width = width ? `${width}px` : '';
          element.style.height = 'auto';
        }
        return result;
      };
      view.onResize = width => {
        element.style.width = `${Math.round(width)}px`;
        element.style.height = 'auto';
      };
      view.onCommit = (width, height) => {
        const position = props.getPos();
        if (position === undefined || !props.editor.isEditable) return;
        props.editor.commands.setNodeSelection(position);
        setImageAttributes(props.editor, {
          width: imageDimension(Math.round(width)) ?? null,
          height: imageDimension(Math.round(height)) ?? null
        });
      };
      element.style.height = 'auto';
      return view;
    };
  },
  parseHTML() {
    return [
      { tag: 'img[src]', getAttrs: element => (safeManualUrl(element.getAttribute('src') ?? '', true) ? null : false) }
    ];
  }
}).configure({
  allowBase64: false,
  resize: {
    enabled: true,
    directions: ['bottom-left', 'bottom-right'],
    minWidth: 24,
    minHeight: 24,
    alwaysPreserveAspectRatio: true
  }
});
