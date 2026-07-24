'use client';

import { useIframeContext } from '@/contexts/IframeContext';
import { DynamicText } from './DynamicI18nText.client';

const IntroSection = ({ initialBlocks }: { initialBlocks?: any[] }) => {
  let intro = '簡化流程，提高效率，讓您的租務管理更輕鬆！\n隨時隨地掌握租務動態，安心管理，省心生活。',
    introStyle = {},
    lineStyle = {},
    title = '租務管理系統，一站式解決方案！',
    titleStyle = {};
  const { hasIframe } = useIframeContext();
  const block = initialBlocks?.find(bloc => bloc.type === 'section' && bloc.id === 'home-section');

  try {
    if (!block) {
      throw new Error('home-section block not found');
    }

    title = block.title ?? title;
    titleStyle = block.titleStyle ?? titleStyle;
    lineStyle = block.lineStyle ?? lineStyle;
    intro = block.intro ?? intro;
    introStyle = block.introStyle ?? introStyle;
  } catch {
    // Keep the defaults defined above when block lookup/parsing fails.
  }

  return (
    <section className="py-25 bg-background">
      <div
        data-block-id="home-section"
        data-block-role="section"
        className={`container mx-auto px-4 flex flex-col gap-10 items-center ${hasIframe ? 'cursor-editor' : ''}`}
      >
        <h2 className="text-4xl font-bold text-foreground mb-4 relative w-fit">
          <span data-block-id="home-section" data-block-role="title" style={titleStyle}>
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
          className="text-foreground text-[30px] max-w-2xl mx-auto leading-relaxed whitespace-pre-wrap"
          data-block-id="home-section"
          data-block-role="intro"
          style={introStyle}
        >
          <DynamicText text={intro} />
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
