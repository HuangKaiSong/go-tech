'use client';

import { useEffect, useMemo, useState } from 'react';
import { type PageBlock, PageBlocks } from '@/app/components/PageBlocks';
import { useIframeContext } from '@/contexts/IframeContext';

const FeatureGridSection = ({ initialBlocks, page = 'home' }: { initialBlocks?: PageBlock[]; page?: string }) => {
  const { hasIframe } = useIframeContext();

  const nonHeroBlocks = useMemo(() => (initialBlocks || []).filter(block => block.type !== 'hero'), [initialBlocks]);
  const [blocks, setBlocks] = useState<PageBlock[]>(nonHeroBlocks);

  useEffect(() => {
    setBlocks(nonHeroBlocks);
  }, [nonHeroBlocks]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'SET_PAGE_BLOCKS') return;
      if (event.data.page !== page) return;
      if (!Array.isArray(event.data.blocks)) return;
      const allBlocks = event.data.blocks as PageBlock[];
      setBlocks(allBlocks.filter(block => block.type !== 'hero'));
    };

    window.addEventListener('message', handleMessage);

    window.parent.postMessage(
      {
        type: 'PAGE_BLOCKS_SYNC',
        page,
        blocks
      },
      '*'
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // oxlint-disable react-hooks/exhaustive-deps
  }, [hasIframe, blocks]);

  return <PageBlocks blocks={blocks} hasIframe={hasIframe} />;
};

export default FeatureGridSection;
