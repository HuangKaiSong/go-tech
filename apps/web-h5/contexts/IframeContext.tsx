'use client';

import { type ReactNode, createContext, useContext, useEffect, useRef } from 'react';

interface IframeContextType {
  hasIframe: boolean;
}

const IframeContext = createContext<IframeContextType | undefined>(undefined);

const SNAPSHOT_STYLE_KEYS = [
  'font-size',
  'color',
  'text-align',
  'line-height',
  'padding',
  'margin',
  'background-image',
  'background-color',
  'width',
  'height',
  'bottom',
  'border-radius'
] as const;

const snapshotComputedStyles = (element: HTMLElement) => {
  const view = element.ownerDocument.defaultView;
  if (!view) return {};
  const computed = view.getComputedStyle(element);
  return SNAPSHOT_STYLE_KEYS.reduce<Record<string, string>>((acc, key) => {
    const value = computed.getPropertyValue(key);
    if (value) acc[key] = value;
    return acc;
  }, {});
};

const buildSnapshotOuterHtml = (element: HTMLElement) => {
  const clone = element.cloneNode(true) as HTMLElement;
  const sourceNodes = [element, ...Array.from(element.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index] as HTMLElement | undefined;
    if (!cloneNode || !(sourceNode instanceof HTMLElement)) return;
    const styles = snapshotComputedStyles(sourceNode);
    cloneNode.setAttribute('data-computed-style', JSON.stringify(styles));
  });

  return clone.outerHTML;
};

const ensureElementId = (element: HTMLElement) => {
  const existing = element.getAttribute('data-cursor-id');
  if (existing) return existing;
  const nextId = `cursor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  element.setAttribute('data-cursor-id', nextId);
  return nextId;
};

const findTarget = (target?: {
  block?: { id?: string; role?: string; seq?: string | number };
  id?: string;
  role?: string;
}) => {
  if (!target) return null;

  const block = target.block;
  const blockId = block?.id;
  const blockRole = block?.role;
  const blockSeq = block?.seq;

  if (blockId && blockRole && blockSeq !== undefined && blockSeq !== null) {
    const byBlockRoleAndSeq = document.querySelector(
      `[data-block-id="${blockId}"][data-block-role="${blockRole}"][data-block-seq="${String(blockSeq)}"]`
    );
    if (byBlockRoleAndSeq instanceof HTMLElement) return byBlockRoleAndSeq;
  }

  if (blockId && blockRole) {
    const byBlockAndRole = document.querySelector(`[data-block-id="${blockId}"][data-block-role="${blockRole}"]`);
    if (byBlockAndRole instanceof HTMLElement) return byBlockAndRole;
  }

  if (blockId) {
    const byBlock = document.querySelector(`[data-block-id="${blockId}"]`);
    if (byBlock instanceof HTMLElement) return byBlock;
  }

  if (target.id) {
    const byCursorId = document.querySelector(`[data-cursor-id="${target.id}"]`);
    if (byCursorId instanceof HTMLElement) return byCursorId;
  }

  if (target.role) {
    const byRole = document.querySelector(`[data-block-role="${target.role}"]`);
    if (byRole instanceof HTMLElement) return byRole;
  }

  return null;
};

const applyStyle = (el: HTMLElement, style: Record<string, unknown>) => {
  Object.entries(style).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'number') {
      // @ts-expect-error - dynamic style assignment
      el.style[key] = `${value}px`;
      return;
    }
    // @ts-expect-error - dynamic style assignment
    el.style[key] = value as string;
  });
};

export const IframeProvider: React.FC<{
  children: ReactNode;
  hasIframe: boolean;
}> = ({ children, hasIframe }) => {
  const selectedIdRef = useRef<string | null>(null);

  const clearAllSelections = () => {
    const selectedElements = document.querySelectorAll('[data-cursor-id]');
    selectedElements.forEach(node => {
      if (node instanceof HTMLElement) {
        node.style.outline = '';
        node.style.outlineOffset = '';
      }
    });
    selectedIdRef.current = null;
  };

  const applySelectedStyle = (element: HTMLElement) => {
    clearAllSelections();
    element.style.outline = '2px solid #f46325';
    element.style.outlineOffset = '2px';
  };

  const handleClick = (e: Event) => {
    const target = e.target as HTMLElement;

    const elementWithCursorEditor = target.closest('.cursor-editor');
    if (elementWithCursorEditor) {
      const id = ensureElementId(elementWithCursorEditor as HTMLElement);
      selectedIdRef.current = id;
      applySelectedStyle(elementWithCursorEditor as HTMLElement);
      const tagName = elementWithCursorEditor.tagName.toLowerCase();

      const elementInfo = {
        tagName,
        className: elementWithCursorEditor.className || '',
        rect: elementWithCursorEditor.getBoundingClientRect(),
        innerHTML: elementWithCursorEditor.innerHTML || '',
        outerHTML: buildSnapshotOuterHtml(elementWithCursorEditor as HTMLElement),
        styles: snapshotComputedStyles(elementWithCursorEditor as HTMLElement),
        dataset: { ...(elementWithCursorEditor as HTMLElement).dataset },
        id,
        timestamp: Date.now()
      };
      window.parent.postMessage(
        {
          type: 'ELEMENT_CLICKED',
          element: elementInfo
        },
        '*'
      );
      return;
    }

    clearAllSelections();
  };

  // oxlint-disable eslint/complexity
  const handleMessage = (event: MessageEvent) => {
    if (!hasIframe || !event.data?.type) return;

    switch (event.data.type) {
      case 'UPDATE_ELEMENT_TEXT': {
        const el = findTarget(event.data);
        if (el) el.textContent = event.data.text ?? '';
        break;
      }
      case 'UPDATE_ELEMENT_STYLE': {
        const el = findTarget(event.data);
        if (el && event.data.style) {
          applyStyle(el, event.data.style);
        }
        break;
      }
      case 'CREATE_TEXT_ELEMENT': {
        const el = document.createElement('p');
        el.className = 'cursor-editor';
        el.textContent = event.data.text ?? '文字';
        const id = ensureElementId(el);
        selectedIdRef.current = id;
        if (event.data.style) {
          applyStyle(el, event.data.style);
        }
        const parent = findTarget({ id: event.data.parentId }) || document.body;
        parent.appendChild(el);
        applySelectedStyle(el);
        break;
      }
      case 'CREATE_BUTTON_ELEMENT': {
        const el = document.createElement('button');
        el.className = 'cursor-editor';
        el.textContent = event.data.label ?? '按鈕';
        const id = ensureElementId(el);
        selectedIdRef.current = id;
        if (event.data.style) {
          applyStyle(el, event.data.style);
        }
        const parent = findTarget({ id: event.data.parentId }) || document.body;
        parent.appendChild(el);
        applySelectedStyle(el);
        break;
      }
      case 'SET_BACKGROUND_IMAGE': {
        const url = event.data.url as string;
        const el = findTarget(event.data);
        if (el && url) {
          el.style.backgroundImage = `url(${url})`;
        }
        break;
      }
      case 'UPDATE_ELEMENT_ATTR': {
        const el = findTarget(event.data);
        const attr = event.data.attr as string;
        const value = event.data.value as string;
        if (el && attr && value !== undefined && value !== null) {
          el.setAttribute(attr, String(value));
          if (attr === 'src' && el instanceof HTMLImageElement) {
            el.src = String(value);
          }
        }
        break;
      }
      case 'SET_ELEMENT': {
        const el = findTarget(event.data);
        if (!el) break;
        el.innerHTML = event.data.element;
        break;
      }
      case 'CLEAR_SELECTION': {
        clearAllSelections();
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!hasIframe) return;

    // .cursor-editor
    const editors = document.getElementsByClassName('cursor-editor');
    Array.prototype.map.call(editors, el => {
      el.addEventListener('click', handleClick);
    });
    // document.addEventListener('click', handleClick)
    window.addEventListener('message', handleMessage);

    return () => {
      Array.prototype.map.call(editors, el => {
        el.removeEventListener('click', handleClick);
      });
      // document.removeEventListener('click', handleClick)
      window.removeEventListener('message', handleMessage);
    };
    // oxlint-disable react-hooks/exhaustive-deps
  }, [hasIframe]);

  return <IframeContext.Provider value={{ hasIframe }}>{children}</IframeContext.Provider>;
};

export const useIframeContext = () => {
  const context = useContext(IframeContext);
  if (!context) {
    throw new Error('useIframeContext must be used within an IframeProvider');
  }
  return context;
};
