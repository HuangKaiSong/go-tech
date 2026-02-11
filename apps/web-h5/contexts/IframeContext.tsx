"use client";

import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

interface IframeContextType {
  hasIframe: boolean;
}

const IframeContext = createContext<IframeContextType | undefined>(undefined);

export const IframeProvider: React.FC<{
  children: ReactNode;
  hasIframe: boolean;
}> = ({ children, hasIframe }) => {

  const selectedIdRef = useRef<string | null>(null);

  const ensureElementId = (element: HTMLElement) => {
    const existing = element.getAttribute("data-cursor-id");
    if (existing) return existing;
    const nextId = `cursor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    element.setAttribute("data-cursor-id", nextId);
    return nextId;
  };

  const clearAllSelections = () => {
    const selectedElements = document.querySelectorAll("[data-cursor-id]");
    selectedElements.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.outline = "";
        node.style.outlineOffset = "";
      }
    });
    selectedIdRef.current = null;
  };

  const applySelectedStyle = (element: HTMLElement) => {
    clearAllSelections();
    element.style.outline = "2px solid #f46325";
    element.style.outlineOffset = "2px";
  };

  const handleClick = (e: Event) => {
    const target = e.target as HTMLElement;

    const elementWithCursorEditor = target.closest(".cursor-editor");
    if (elementWithCursorEditor) {
      const id = ensureElementId(elementWithCursorEditor as HTMLElement);
      selectedIdRef.current = id;
      applySelectedStyle(elementWithCursorEditor as HTMLElement);
      const computedStyle = window.getComputedStyle(
        elementWithCursorEditor as HTMLElement
      );
      
      const tagName = elementWithCursorEditor.tagName.toLowerCase();

      const elementInfo = {
        tagName: tagName,
        className: elementWithCursorEditor.className || '',
        rect: elementWithCursorEditor.getBoundingClientRect(),
        innerHTML: elementWithCursorEditor.innerHTML || '',
        outerHTML: elementWithCursorEditor.outerHTML || '',
        dataset: { ...(elementWithCursorEditor as HTMLElement).dataset },
        styles: {
          fontSize: computedStyle.fontSize,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          backgroundImage: computedStyle.backgroundImage,
          width: computedStyle.width,
          height: computedStyle.height,
          borderRadius: computedStyle.borderRadius,
          padding: computedStyle.padding,
          margin: computedStyle.margin,
          textAlign: computedStyle.textAlign,
          lineHeight: computedStyle.lineHeight,
        },
        id,
        timestamp: Date.now(),
      };
      window.parent.postMessage(
        {
          type: 'ELEMENT_CLICKED',
          element: elementInfo
        },
        '*',
      )
      return;
    }

    clearAllSelections();
  }

  const handleMessage = (event: MessageEvent) => {
    if (!hasIframe || !event.data?.type) return;

    const findTarget = (id?: string) => {
      if (!id) return null;
      const el = document.querySelector(`[data-cursor-id="${id}"]`);
      return el instanceof HTMLElement ? el : null;
    };

    const applyStyle = (el: HTMLElement, style: Record<string, unknown>) => {
      Object.entries(style).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (typeof value === "number") {
          // @ts-expect-error - dynamic style assignment
          el.style[key] = `${value}px`;
          return;
        }
        // @ts-expect-error - dynamic style assignment
        el.style[key] = value as string;
      });
    };

    switch (event.data.type) {
      case "UPDATE_ELEMENT_TEXT": {
        const el = findTarget(event.data.id);
        if (el) el.textContent = event.data.text ?? "";
        break;
      }
      case "UPDATE_ELEMENT_STYLE": {
        const el = findTarget(event.data.id);
        if (el && event.data.style) {
          applyStyle(el, event.data.style);
        }
        break;
      }
      case "CREATE_TEXT_ELEMENT": {
        const el = document.createElement("p");
        el.className = "cursor-editor";
        el.textContent = event.data.text ?? "文字";
        const id = ensureElementId(el);
        selectedIdRef.current = id;
        if (event.data.style) {
          applyStyle(el, event.data.style);
        }
        const parent = findTarget(event.data.parentId) || document.body;
        parent.appendChild(el);
        applySelectedStyle(el);
        break;
      }
      case "CREATE_BUTTON_ELEMENT": {
        const el = document.createElement("button");
        el.className = "cursor-editor";
        el.textContent = event.data.label ?? "按鈕";
        const id = ensureElementId(el);
        selectedIdRef.current = id;
        if (event.data.style) {
          applyStyle(el, event.data.style);
        }
        const parent = findTarget(event.data.parentId) || document.body;
        parent.appendChild(el);
        applySelectedStyle(el);
        break;
      }
      case "SET_BACKGROUND_IMAGE": {
        const url = event.data.url as string;
        const el = findTarget(event.data.id);
        if (el && url) {
          el.style.backgroundImage = `url(${url})`;
        }
      }
      case "CLEAR_SELECTION": {
        clearAllSelections();
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!hasIframe) return;

    document.addEventListener('click', handleClick)
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener("message", handleMessage);
    }
  }, [hasIframe])

  return (
    <IframeContext.Provider value={{ hasIframe }}>
      {children}
    </IframeContext.Provider>
  );
};

export const useIframeContext = () => {
  const context = useContext(IframeContext);
  if (!context) {
    throw new Error("useIframeContext must be used within an IframeProvider");
  }
  return context;
};
