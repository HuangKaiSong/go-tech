import { Button } from "@go-tech-frontend/ui";
import { RefObject, useEffect, useRef, useState } from "react";
import Common from "./Common";
import Hero from "./Hero";
import Home from "./page/Home";
import {
  AdminBlock,
  AdminHeroBlock,
  BlockType,
  CommonBlock,
  PageKey,
} from "./type";
import { createElementFromOuterHTML } from "./utils";

export default function PanlEditor({
  iframeRef,
}: {
  iframeRef: RefObject<HTMLIFrameElement>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messageEl, setMessageEl] = useState<HTMLElement>(null);

  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const blocksRef = useRef<AdminBlock[]>([]);
  const [pageKey, setPageKey] = useState<PageKey>(PageKey.Home);
  const [showHero, setShowHero] = useState<boolean>(false);
  const [showCommon, setShowCommon] = useState<boolean>(false);
  const [showHome, setShowHome] = useState<boolean>(false);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const handleMessage = async (event: MessageEvent) => {
    if (event.origin !== import.meta.env.VITE_H5_SITE_URL) {
      return;
    }

    if (event.data && event.data.type === "ELEMENT_CLICKED") {
      const clickedElement = event.data.element;

      if (!clickedElement?.id) return;
      // 根据传输的 outerHTML 创建 DOM 元素
      const element = createElementFromOuterHTML(clickedElement.outerHTML);

      setMessageEl(element);
      // 根据 element 子元素的 data-block-id 属性判断是什么类型的块
      const temBlocks = clickedElement.outerHTML
        ? element.querySelectorAll("[data-block-id]")
        : [element];
      const heroFlag = Array.prototype.some.call(temBlocks, (node) => {
        return node.dataset.blockId.includes("hero");
      });
      const commonFlag = Array.prototype.some.call(temBlocks, (node) => {
        return node.dataset.blockId.includes("common");
      });
      const homeFlag = Array.prototype.some.call(temBlocks, (node) => {
        return node.dataset.blockId.includes("home");
      });

      setShowHero(heroFlag);
      setShowCommon(commonFlag);
      setShowHome(homeFlag);
    }

    if (event.data && event.data.type === "PAGE_BLOCKS_SYNC") {
      if (!Array.isArray(event.data.blocks)) return;
      const nextPage = event.data.page as PageKey;
      if (nextPage) setPageKey(nextPage);
      setBlocks(event.data.blocks as AdminBlock[]);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const postToIframe = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      payload,
      import.meta.env.VITE_H5_SITE_URL,
    );
  };

  const handlePatchHeroBlock = (
    blockId: string,
    blockSeq: number | undefined,
    patch: Partial<AdminHeroBlock>,
  ) => {
    setBlocks((prev) => {
      if (blockSeq !== undefined && blockSeq >= 0 && blockSeq < prev.length) {
        const block = prev[blockSeq];
        if (block?.type === BlockType.Hero) {
          const next = [...prev];
          next[blockSeq] = { ...block, ...patch } as AdminBlock;
          return next;
        }
      }

      return prev.map((block) => {
        if (block.id !== blockId || block.type !== BlockType.Hero) return block;
        return { ...block, ...patch } as AdminBlock;
      });
    });
  };

  const handlePatchCommonBlock = (
    blockId: string,
    _blockSeq: number | undefined,
    patch: Partial<CommonBlock>,
    type: BlockType = BlockType.Common,
  ) => {
    setBlocks((prev) => {
      const existingIndex = prev.findIndex(
        (block) => block.type === type && block.id === blockId,
      );

      if (existingIndex === -1) {
        return [
          ...prev,
          {
            id: blockId,
            type,
            ...patch,
          } as AdminBlock,
        ];
      }

      const next = [...prev];
      const current = next[existingIndex] as CommonBlock;
      const nextValues = {
        ...(current.values || {}),
        ...(patch.values || {}),
      };
      next[existingIndex] = {
        ...current,
        ...patch,
        values: nextValues,
      } as AdminBlock;
      return next;
    });
  };

  const handleAddHeroAfter = (blockSeq: number) => {
    setBlocks((prev) => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const current = prev[blockSeq];
      if (!current || current.type !== BlockType.Hero) return prev;
      const source = current as AdminHeroBlock;
      const nextHero: AdminHeroBlock = {
        ...source,
        id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      const next = [...prev];
      next.splice(blockSeq + 1, 0, nextHero);
      return next;
    });
  };

  const handleRemoveHero = (blockSeq: number) => {
    setBlocks((prev) => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const current = prev[blockSeq];
      if (!current || current.type !== BlockType.Hero) return prev;
      const heroCount = prev.filter(
        (block) => block.type === BlockType.Hero,
      ).length;
      if (heroCount <= 1) return prev;
      return prev.filter((_, index) => index !== blockSeq);
    });
  };

  const handleMoveHero = (blockSeq: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const targetSeq = direction === "up" ? blockSeq - 1 : blockSeq + 1;
      if (targetSeq < 0 || targetSeq >= prev.length) return prev;
      if (prev[blockSeq]?.type !== BlockType.Hero) return prev;
      if (prev[targetSeq]?.type !== BlockType.Hero) return prev;
      const next = [...prev];
      const temp = next[blockSeq];
      next[blockSeq] = next[targetSeq];
      next[targetSeq] = temp;
      return next;
    });
  };

  const clearSelection = () => {
    postToIframe({ type: "CLEAR_SELECTION" });
  };

  const applyBlocksToPreview = async () => {
    postToIframe({
      type: "SET_PAGE_BLOCKS",
      page: pageKey,
      blocks: blocksRef.current,
    });

    try {
      await fetch(`/h5-hook/api/page-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageKey,
          blocks: blocksRef.current,
        }),
      });
    } catch {
      // ignore save errors for now
    }
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      pages: {
        [pageKey]: blocksRef.current,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pageKey}-blocks.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const nextBlocks =
          parsed?.pages?.[pageKey] ||
          parsed?.blocks ||
          parsed?.[pageKey] ||
          null;
        if (!Array.isArray(nextBlocks)) return;
        setBlocks(nextBlocks as AdminBlock[]);
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      <div className="rounded-2xl border border-border bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              页面编辑器
            </div>
            <div className="text-lg font-semibold text-foreground">
              首页 / 组件组装
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              同步后会实时更新左侧预览。
            </div>
          </div>
          <div className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
            预览中
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={applyBlocksToPreview}>
            同步到预览
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportJson}>
            导出 JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            导入 JSON
          </Button>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            清除选中
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportJson(file);
            if (e.target) e.target.value = "";
          }}
        />
      </div>

      {showHero && (
        <Hero
          element={messageEl}
          sync={postToIframe}
          onPatchBlock={handlePatchHeroBlock}
          onAddHeroAfter={handleAddHeroAfter}
          onRemoveHero={handleRemoveHero}
          onMoveHero={handleMoveHero}
        />
      )}
      {showCommon && (
        <Common
          element={messageEl}
          sync={postToIframe}
          onPatchBlock={handlePatchCommonBlock}
        />
      )}
      {showHome && (
        <Home
          key={messageEl.outerHTML}
          element={messageEl}
          sync={postToIframe}
          onPatchBlock={handlePatchCommonBlock}
        />
      )}
    </div>
  );
}
