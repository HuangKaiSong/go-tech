'use client';

import { Button } from '@go-tech/web-ui';
import { type CSSProperties } from 'react';
import Slider from 'react-slick';
import Link from '@/app/components/Link';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick-theme.css';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick.css';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { DynamicText } from '../DynamicI18nText';

type BlockBase = {
  id: string;
  type: string;
};

export type HeroBlock = BlockBase & {
  backgroundImage: string;
  buttonLink?: string;
  buttonStyle?: CSSProperties;
  buttonText?: string;
  contentStyle?: CSSProperties;
  sectionStyle?: CSSProperties;
  subtitle: string;
  subtitleStyle?: CSSProperties;
  title: string;
  titleSecondary: string;
  titleSecondaryStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  type: 'hero';
};

const cursorClass = (hasIframe: boolean) => (hasIframe ? 'cursor-editor' : '');

function RenderBlock({ block, hasIframe: _hasIframe, seq }: { block: HeroBlock; hasIframe: boolean; seq: number }) {
  const sectionStyle = block.sectionStyle || {
    paddingTop: '8rem',
    paddingBottom: '8rem'
  };
  const blockTitle = useBatchTranslation(block.title);
  const titleSecondary = useBatchTranslation(block.titleSecondary);

  return (
    <section className="relative flex-1" style={sectionStyle}>
      <div
        data-block-id={block.id}
        data-block-seq={seq}
        data-block-role="background"
        className="absolute w-full h-full inset-0 bg-size_100 bg-center bg-cover"
        style={{
          backgroundImage: `url(${block.backgroundImage})`
        }}
      />
      <div className="container h-full mx-auto px-4 relative z-10 bg-transparent">
        <div style={block.contentStyle}>
          <h1
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="title"
            className="text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line"
            style={block.titleStyle}
            dangerouslySetInnerHTML={{ __html: blockTitle }}
          />
          <h2
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="titleSecondary"
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={block.titleSecondaryStyle}
            dangerouslySetInnerHTML={{ __html: titleSecondary }}
          />
          <p data-block-id={block.id} data-block-seq={seq} data-block-role="subtitle" style={block.subtitleStyle}>
            <DynamicText text={block.subtitle} />
          </p>
          {block.buttonText && block.buttonLink ? (
            <Link href={block.buttonLink}>
              <Button
                data-block-id={block.id}
                data-block-seq={seq}
                data-block-role="buttonText"
                data-block-link={block.buttonLink}
                size="lg"
                style={block.buttonStyle}
              >
                <DynamicText text={block.buttonText} />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function Hero({
  hasIframe,
  heros,
  startIndex = 0
}: {
  hasIframe: boolean;
  heros: HeroBlock[];
  startIndex?: number;
}) {
  const settings = {
    dots: !hasIframe,
    infinite: !hasIframe,
    autoplaySpeed: 5000,
    autoplay: !hasIframe,
    slidesToShow: 1,
    slidesToScroll: 1
  };

  return (
    <Slider {...settings} className={`relative w-full overflow-hidden ${cursorClass(hasIframe)}`}>
      {heros.map((hero, index) => (
        <RenderBlock
          block={hero}
          hasIframe={hasIframe}
          seq={startIndex + index}
          key={`${hero.id}-${startIndex + index}`}
        />
      ))}
    </Slider>
  );
}
