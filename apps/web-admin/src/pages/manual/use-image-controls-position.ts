import { useLayoutEffect, useRef, useState } from 'react';

const margin = 12;

/** 从编辑区和固定操作栏计算可用空间，避免正文内部滚动时遮住保存按钮。 */
function imageSpace(anchor: HTMLImageElement, rect: DOMRect) {
  const editor = anchor.closest('.manual-editor');
  const editorRect = editor?.getBoundingClientRect();
  const pane = anchor.closest('[aria-label="內容編輯"]');
  const paneRect = pane?.getBoundingClientRect();
  const actionsRect = pane?.querySelector('[data-manual-actions]')?.getBoundingClientRect();
  // 浮层避开固定的保存栏，并限制在正文当前可见区域内。
  const ceiling = Math.max(margin, (actionsRect?.bottom ?? paneRect?.top ?? 0) + margin);
  const floor = Math.min(window.innerHeight - margin, (paneRect?.bottom ?? window.innerHeight) - margin);
  const rightEdge = Math.min(window.innerWidth - margin, paneRect?.right ?? window.innerWidth - margin);
  const sideWidth = rightEdge - rect.right - margin * 2;
  // 小图片右侧有足够空间时优先并排显示，避免面板盖住整张图片或拖拽角落。
  const beside = sideWidth >= 280;
  const width = beside
    ? Math.min(360, sideWidth)
    : Math.min(480, window.innerWidth - margin * 2, editorRect?.width || 480);
  return { ceiling, floor, beside, width };
}

/** 浮层挂在 body，捕获所有祖先滚动；正文独立滚动时仍贴近选中的图片。 */
export function useImageControlsPosition(anchor: HTMLImageElement | null) {
  const panel = useRef<HTMLFieldSetElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 0, visible: false });
  useLayoutEffect(() => {
    if (!anchor) return;
    function place() {
      if (!anchor || !panel.current) return;
      const rect = anchor.getBoundingClientRect();
      const { beside, ceiling, floor, width } = imageSpace(anchor, rect);
      const maxHeight = Math.max(80, floor - ceiling);
      const height = Math.min(panel.current.getBoundingClientRect().height, maxHeight);
      const bottom = Math.min(rect.bottom, floor);
      const top = Math.max(rect.top, ceiling);
      const visible = rect.bottom > ceiling && rect.top < floor;
      const below = bottom + margin;
      let nextTop = top - height - margin;
      if (beside) nextTop = top;
      else if (below + height <= floor) nextTop = below;
      else if (nextTop < ceiling) nextTop = Math.min(floor - height, bottom - height - margin * 2);
      setPosition({
        left: beside ? rect.right + margin : Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        top: Math.max(ceiling, Math.min(nextTop, floor - height)),
        maxHeight,
        width,
        visible
      });
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    anchor.addEventListener('load', place);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(anchor);
    if (panel.current) observer?.observe(panel.current);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      anchor.removeEventListener('load', place);
      observer?.disconnect();
    };
  }, [anchor]);
  return { panel, position };
}
