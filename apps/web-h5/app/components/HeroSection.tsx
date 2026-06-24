'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultHomeBlocks } from '@/app/components/blockDefaults';
import { type PageBlock, PageBlocks } from '@/app/components/PageBlocks';
import { useIframeContext } from '@/contexts/IframeContext';

const mergeHeroDefaults = (nextBlocks: PageBlock[]) =>
  nextBlocks.map(block => {
    return {
      ...block
    };
  });

const HeroSection = ({ initialBlocks, page = 'home' }: { initialBlocks?: PageBlock[]; page?: string }) => {
  const { hasIframe } = useIframeContext();

  const resolvedBlocks = useMemo(
    () => mergeHeroDefaults(initialBlocks?.length ? initialBlocks : defaultHomeBlocks),
    [initialBlocks]
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
      setBlocks(mergeHeroDefaults(event.data.blocks as PageBlock[]));
    };

    window.addEventListener('message', handleMessage);

    // 將當前模块推送到管理端以進行初始同步.
    window.parent.postMessage(
      {
        type: 'PAGE_BLOCKS_SYNC',
        page,
        blocks: mergeHeroDefaults(blocks)
      },
      '*'
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // oxlint-disable react-hooks/exhaustive-deps
  }, [hasIframe, blocks]);

  return (
    <div className="min-h-150">
      <PageBlocks blocks={blocks} hasIframe={hasIframe} />
    </div>
  );
};

export default HeroSection;
