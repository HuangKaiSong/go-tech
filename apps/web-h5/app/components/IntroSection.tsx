'use client';

import { useEffect, useState } from 'react';
import { useIframeContext } from '@/contexts/IframeContext';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';
import { type PageBlock, type SectionBlock } from './PageBlocks';

const defaultContent = {
  pms: {
    title: '租務管理系統，一站式解決方案！',
    intro: '簡化繳費、帳單及收款，通過分類輕鬆管理查詢、自動提醒及批量通知到期，省心管理、協心合作。'
  },
  hr: {
    title: '人力資源管理系統，一站式 SaaS 解決方案！',
    intro: '覆蓋人事、考勤、薪資、審批、績效、培訓與報表分析，助企業建立標準化、數碼化的人力資源管理流程。'
  }
};

const resolveSectionContent = (blocks: PageBlock[], productKey: 'hr' | 'pms') => {
  const block = blocks.find(
    (candidate): candidate is SectionBlock => candidate.type === 'section' && candidate.id === 'home-section'
  );
  const productContent = block?.products?.find(product => product.key === productKey);
  const fallback = defaultContent[productKey];
  const legacyTitle = productKey === 'pms' ? block?.title : undefined;
  const legacyIntro = productKey === 'pms' ? block?.intro : undefined;

  return {
    intro: productContent?.intro ?? legacyIntro ?? fallback.intro,
    introStyle: block?.introStyle || {},
    lineStyle: block?.lineStyle || {},
    title: productContent?.title ?? legacyTitle ?? fallback.title,
    titleStyle: block?.titleStyle || {}
  };
};

const IntroSection = ({ initialBlocks }: { initialBlocks?: PageBlock[] }) => {
  const { hasIframe } = useIframeContext();
  const productSelection = useOptionalProductSelection();
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks || []);

  useEffect(() => {
    setBlocks(initialBlocks || []);
  }, [initialBlocks]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SET_PAGE_BLOCKS' || event.data.page !== 'home') return;
      if (!Array.isArray(event.data.blocks)) return;
      setBlocks(event.data.blocks as PageBlock[]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasIframe]);

  const productKey = productSelection?.product || 'pms';
  const { intro, introStyle, lineStyle, title, titleStyle } = resolveSectionContent(blocks, productKey);

  return (
    <section className="py-16 bg-background">
      <div
        data-block-id="home-section"
        data-block-role="section"
        data-product-key={productKey}
        className={`container mx-auto px-4 flex flex-col gap-4 items-center ${hasIframe ? 'cursor-editor' : ''}`}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4 relative w-fit">
          <span data-block-id="home-section" data-block-role="title" data-product-key={productKey} style={titleStyle}>
            <DynamicText text={title} />
          </span>
          <div
            data-block-id="home-section"
            data-block-role="line"
            style={lineStyle}
            className="h-0.75 w-4/5 absolute -bottom-2 bg-primary left-1/2 -translate-x-1/2"
          />
        </h2>

        <div
          className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center"
          data-block-id="home-section"
          data-block-role="intro"
          data-product-key={productKey}
          style={introStyle}
        >
          <DynamicText text={intro} />
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
