'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultHomeBlocks } from '@/app/components/blockDefaults';
import { type PageBlock, PageBlocks } from '@/app/components/PageBlocks';
import type { HeroBlock } from '@/app/components/PageBlocks/Hero';
import { useIframeContext } from '@/contexts/IframeContext';

const mergeHeroDefaults = (
  nextBlocks: PageBlock[],
  productSwitcherPlacement?: HeroBlock['productSwitcherPlacement']
): PageBlock[] =>
  nextBlocks.map(block => {
    // 页面布局优先于旧配置，后台同步或导入 JSON 时也保持相同的切换栏位置。
    if (productSwitcherPlacement && block.type === 'hero') {
      return { ...block, productSwitcherPlacement };
    }
    return {
      ...block
    };
  });

const HeroSection = ({
  initialBlocks,
  page = 'home',
  productSwitcherPlacement,
  renderOnly
}: {
  initialBlocks?: PageBlock[];
  page?: string;
  productSwitcherPlacement?: HeroBlock['productSwitcherPlacement'];
  renderOnly?: 'hero' | 'nonHero';
}) => {
  const { hasIframe } = useIframeContext();

  const resolvedBlocks = useMemo(
    () => mergeHeroDefaults(initialBlocks?.length ? initialBlocks : defaultHomeBlocks, productSwitcherPlacement),
    [initialBlocks, productSwitcherPlacement]
  );
  const [blocks, setBlocks] = useState<PageBlock[]>(resolvedBlocks);

  useEffect(() => {
    setBlocks(resolvedBlocks);
  }, [resolvedBlocks]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'SET_PAGE_BLOCKS') return;
      if (event.data.page !== page) return;
      if (!Array.isArray(event.data.blocks)) return;
      setBlocks(mergeHeroDefaults(event.data.blocks as PageBlock[], productSwitcherPlacement));
    };

    window.addEventListener('message', handleMessage);

    // 將當前模块推送到管理端以進行初始同步.
    window.parent.postMessage(
      {
        type: 'PAGE_BLOCKS_SYNC',
        page,
        blocks: mergeHeroDefaults(blocks, productSwitcherPlacement)
      },
      '*'
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [hasIframe, blocks, page, productSwitcherPlacement]);

  return (
    <div
      className={
        blocks.some(block => block.type === 'hero' && block.productSwitcherPlacement === 'below-hero')
          ? undefined
          : 'min-h-150'
      }
    >
      <PageBlocks blocks={blocks} hasIframe={hasIframe} renderOnly={renderOnly} />
    </div>
  );
};

export default HeroSection;
