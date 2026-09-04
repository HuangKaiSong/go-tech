import { Button, Tabs, TabsList, TabsTrigger } from '@go-tech-frontend/ui';
import { type RefObject, useEffect, useRef, useState } from 'react';
import Common from './Common';
import LegacyHero from './Hero';
import Home from './page/Home';
import ProductHero from './ProductHero';
import {
  type AdminAudienceBlock,
  type AdminBlock,
  type AdminHeroBlock,
  type AdminSectionBlock,
  BlockType,
  type CommonBlock,
  type HeroProductKey,
  PageKey
} from './type';
import { createElementFromOuterHTML } from './utils';

const pageNames: Record<PageKey, string> = {
  [PageKey.Common]: '通用页面',
  [PageKey.CoreAdvantages]: '核心优势',
  [PageKey.Home]: '首页',
  [PageKey.SystemFeatures]: '查看系统功能',
  [PageKey.TargetAudience]: '适合人群'
};

export default function PanlEditor({ iframeRef }: { iframeRef: RefObject<HTMLIFrameElement> }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasInitializedSelectionRef = useRef(false);
  const [messageEl, setMessageEl] = useState<HTMLElement | null>(null);

  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const blocksRef = useRef<AdminBlock[]>([]);
  const [pageKey, setPageKey] = useState<PageKey>(PageKey.Home);
  const [showHero, setShowHero] = useState<boolean>(false);
  const [showCommon, setShowCommon] = useState<boolean>(false);
  const [showHome, setShowHome] = useState<boolean>(false);
  const [activeProduct, setActiveProduct] = useState<HeroProductKey>('pms');

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    if (hasInitializedSelectionRef.current || blocks.length === 0) return;

    const heroIndex = blocks.findIndex(block => block.type === BlockType.Hero);
    const hero = blocks[heroIndex];
    if (!hero) return;

    hasInitializedSelectionRef.current = true;
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'SELECT_BLOCK',
        block: { id: hero.id, role: 'hero', seq: heroIndex }
      },
      import.meta.env.VITE_H5_SITE_URL
    );
  }, [blocks, iframeRef]);

  const handleMessage = async (event: MessageEvent) => {
    if (event.origin !== import.meta.env.VITE_H5_SITE_URL) {
      return;
    }

    if (event.data && event.data.type === 'ELEMENT_CLICKED') {
      const clickedElement = event.data.element;

      if (!clickedElement?.id) return;
      // 根据传输的 outerHTML 创建 DOM 元素
      const element = createElementFromOuterHTML(clickedElement.outerHTML);
      const clickedProduct = clickedElement.dataset?.productKey || element.dataset.productKey;
      if (clickedProduct === 'hr' || clickedProduct === 'pms') setActiveProduct(clickedProduct);

      setMessageEl(element);
      // 根据 element 子元素的 data-block-id 属性判断是什么类型的块
      const blockNodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>('[data-block-id]'))];
      const heroFlag = blockNodes.some(
        node => node.dataset.blockRole === 'hero' || node.dataset.blockId?.includes('hero')
      );
      const commonFlag = blockNodes.some(node => node.dataset.blockId?.includes('common'));
      const homeFlag = blockNodes.some(node => {
        const blockId = node.dataset.blockId || '';
        return blockId.includes('section') || blockId.includes('audiences') || blockId.includes('testimonial');
      });

      setShowHero(heroFlag);
      setShowCommon(commonFlag);
      setShowHome(homeFlag);
    }

    if (event.data && event.data.type === 'PAGE_BLOCKS_SYNC') {
      if (!Array.isArray(event.data.blocks)) return;
      const nextPage = event.data.page as PageKey;
      if (nextPage) setPageKey(nextPage);
      setBlocks(event.data.blocks as AdminBlock[]);
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const postToIframe = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(payload, import.meta.env.VITE_H5_SITE_URL);
  };

  const productHeroBlock = blocks.find(
    (block): block is AdminHeroBlock => block.type === BlockType.Hero && block.variant === 'product-switcher'
  );

  const handleActiveProductChange = (productKey: HeroProductKey) => {
    setActiveProduct(productKey);
    if (!productHeroBlock) return;

    postToIframe({
      type: 'SET_HERO_PRODUCT',
      blockId: productHeroBlock.id,
      productKey
    });
  };

  const handlePatchHeroBlock = (blockId: string, blockSeq: number | undefined, patch: Partial<AdminHeroBlock>) => {
    const currentBlocks = blocksRef.current;
    let nextBlocks = currentBlocks;

    if (blockSeq !== undefined && blockSeq >= 0 && blockSeq < currentBlocks.length) {
      const block = currentBlocks[blockSeq];
      if (block?.type === BlockType.Hero) {
        nextBlocks = [...currentBlocks];
        nextBlocks[blockSeq] = { ...block, ...patch } as AdminBlock;
      }
    } else {
      nextBlocks = currentBlocks.map(block => {
        if (block.id !== blockId || block.type !== BlockType.Hero) return block;
        return { ...block, ...patch } as AdminBlock;
      });
    }

    blocksRef.current = nextBlocks;
    setBlocks(nextBlocks);
    postToIframe({
      type: 'SET_PAGE_BLOCKS',
      page: pageKey,
      blocks: nextBlocks
    });
  };

  // oxlint-disable eslint/max-params
  const handlePatchCommonBlock = (
    blockId: string,
    _blockSeq: number | undefined,
    patch: Partial<CommonBlock>,
    type: BlockType | string = BlockType.Common
  ) => {
    const currentBlocks = blocksRef.current;
    const existingIndex = currentBlocks.findIndex(block => block.type === type && block.id === blockId);
    const nextBlocks = [...currentBlocks];

    if (existingIndex === -1) {
      nextBlocks.push({
        id: blockId,
        type,
        ...patch
      } as AdminBlock);
    } else {
      const current = nextBlocks[existingIndex] as CommonBlock;
      const nextBlock = {
        ...current,
        ...patch
      };
      if (current.values || patch.values) {
        nextBlock.values = {
          ...(current.values || {}),
          ...(patch.values || {})
        };
      }
      nextBlocks[existingIndex] = nextBlock as AdminBlock;
    }

    blocksRef.current = nextBlocks;
    setBlocks(nextBlocks);
    postToIframe({
      type: 'SET_PAGE_BLOCKS',
      page: pageKey,
      blocks: nextBlocks
    });
  };

  const handleAddHeroAfter = (blockSeq: number) => {
    setBlocks(prev => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const current = prev[blockSeq];
      if (!current || current.type !== BlockType.Hero) return prev;
      const source = current as AdminHeroBlock;
      const nextHero: AdminHeroBlock = {
        ...source,
        id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      };
      const next = [...prev];
      next.splice(blockSeq + 1, 0, nextHero);
      return next;
    });
  };

  const handleRemoveHero = (blockSeq: number) => {
    setBlocks(prev => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const current = prev[blockSeq];
      if (!current || current.type !== BlockType.Hero) return prev;
      const heroCount = prev.filter(block => block.type === BlockType.Hero).length;
      if (heroCount <= 1) return prev;
      return prev.filter((_, index) => index !== blockSeq);
    });
  };

  const handleMoveHero = (blockSeq: number, direction: 'down' | 'up') => {
    setBlocks(prev => {
      if (blockSeq < 0 || blockSeq >= prev.length) return prev;
      const targetSeq = direction === 'up' ? blockSeq - 1 : blockSeq + 1;
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
    setMessageEl(null);
    setShowHero(false);
    setShowCommon(false);
    setShowHome(false);
    postToIframe({ type: 'CLEAR_SELECTION' });
  };

  const applyBlocksToPreview = async () => {
    postToIframe({
      type: 'SET_PAGE_BLOCKS',
      page: pageKey,
      blocks: blocksRef.current
    });

    try {
      await fetch(`/h5-hook/api/page-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageKey,
          blocks: blocksRef.current
        })
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
        [pageKey]: blocksRef.current
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pageKey}-blocks.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const nextBlocks = parsed?.pages?.[pageKey] || parsed?.blocks || parsed?.[pageKey] || null;
        if (!Array.isArray(nextBlocks)) return;
        setBlocks(nextBlocks as AdminBlock[]);
      } catch {
        // ignore invalid json
      }
    });
    reader.readAsText(file);
  };

  let selectedHeroNode: HTMLElement | null = null;
  if (messageEl?.matches('[data-block-id][data-block-seq]')) {
    selectedHeroNode = messageEl;
  } else if (messageEl) {
    selectedHeroNode = messageEl.querySelector('[data-block-id][data-block-seq]');
  }
  const selectedHeroSeq = selectedHeroNode?.dataset.blockSeq ? Number(selectedHeroNode.dataset.blockSeq) : undefined;
  const selectedHeroBlock =
    selectedHeroSeq !== undefined && blocks[selectedHeroSeq]?.type === BlockType.Hero
      ? (blocks[selectedHeroSeq] as AdminHeroBlock)
      : (blocks.find(block => block.type === BlockType.Hero && block.id === selectedHeroNode?.dataset.blockId) as
          | AdminHeroBlock
          | undefined);
  const selectedHomeBlock = blocks.find(block => {
    if (block.type !== BlockType.Section && block.type !== BlockType.Audiences) return false;
    if (block.id === messageEl?.dataset.blockId) return true;
    return Boolean(messageEl?.querySelector(`[data-block-id="${block.id}"]`));
  }) as AdminAudienceBlock | AdminSectionBlock | undefined;

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      <div className="sticky top-0 z-20 rounded-2xl border border-border bg-background bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">页面编辑器</div>
            <div className="text-lg font-semibold text-foreground">{pageNames[pageKey]} / 组件组装</div>
            <div className="text-xs text-muted-foreground mt-1">同步后会实时更新左侧预览。</div>
          </div>
          <div className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">预览中</div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={applyBlocksToPreview}>
            保存并同步
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportJson}>
            导出 JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            导入 JSON
          </Button>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            清除选中
          </Button>
        </div>
        {productHeroBlock ? (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <div className="shrink-0 text-xs font-medium text-muted-foreground">编辑产品</div>
            <Tabs value={activeProduct} onValueChange={value => handleActiveProductChange(value as HeroProductKey)}>
              <TabsList className="grid w-48 grid-cols-2">
                <TabsTrigger value="pms">PMS</TabsTrigger>
                <TabsTrigger value="hr">HR</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImportJson(file);
            if (e.target) e.target.value = '';
          }}
        />
      </div>

      {showHero && selectedHeroBlock?.variant === 'product-switcher' ? (
        <ProductHero
          activeProduct={activeProduct}
          block={selectedHeroBlock}
          blockSeq={selectedHeroSeq}
          onPatchBlock={handlePatchHeroBlock}
        />
      ) : null}
      {showHero && selectedHeroBlock?.variant !== 'product-switcher' ? (
        <LegacyHero
          element={messageEl!}
          sync={postToIframe}
          onPatchBlock={handlePatchHeroBlock}
          onAddHeroAfter={handleAddHeroAfter}
          onRemoveHero={handleRemoveHero}
          onMoveHero={handleMoveHero}
        />
      ) : null}
      {showCommon && <Common element={messageEl!} sync={postToIframe} onPatchBlock={handlePatchCommonBlock} />}
      {showHome && (
        <Home
          key={messageEl!.outerHTML}
          activeProduct={activeProduct}
          block={selectedHomeBlock}
          element={messageEl!}
          sync={postToIframe}
          onPatchBlock={handlePatchCommonBlock}
        />
      )}
    </div>
  );
}
