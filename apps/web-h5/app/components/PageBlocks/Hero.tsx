"use client";

import Link from "@/app/components/Link";
import { Button } from "@go-tech-frontend/ui";
import { CSSProperties } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

type BlockBase = {
  id: string;
  type: string;
};

export type HeroBlock = BlockBase & {
  type: "hero";
  title: string;
  titleSecondary: string;
  subtitle: string;
  titleStyle?: CSSProperties;
  titleSecondaryStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  buttonText?: string;
  buttonLink?: string;
  buttonStyle?: CSSProperties;
  backgroundImage: string;
};

const cursorClass = (hasIframe: boolean) => (hasIframe ? "cursor-editor" : "");

function RenderBlock({
  block,
  hasIframe,
  seq,
}: {
  block: HeroBlock;
  hasIframe: boolean;
  seq: number;
}) {
  const sectionStyle = block.sectionStyle || {
    paddingTop: "8rem",
    paddingBottom: "8rem",
  };

  return (
    <section className="relative flex-1" style={sectionStyle}>
      <div
        data-block-id={block.id}
        data-block-seq={seq}
        data-block-role="background"
        className={`absolute w-full h-full inset-0 bg-size_100 bg-center bg-cover`}
        style={{
          backgroundImage: `url(${block.backgroundImage})`,
        }}
      />
      <div className="container h-full mx-auto px-4 relative z-10 bg-transparent">
        <div style={block.contentStyle}>
          <h1
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="title"
            className={`text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line`}
            style={block.titleStyle}
            dangerouslySetInnerHTML={{ __html: block.title }}
          />
            <h2
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="titleSecondary"
            className={`text-4xl md:text-5xl font-bold text-white mb-6`}
            style={block.titleSecondaryStyle}
            dangerouslySetInnerHTML={{ __html: block.titleSecondary }}
          />
          <p
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="subtitle"
            style={block.subtitleStyle}
          >
            {block.subtitle}
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
                {block.buttonText}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function Hero({
  heros,
  hasIframe,
  startIndex = 0,
}: {
  heros: HeroBlock[];
  hasIframe: boolean;
  startIndex?: number;
}) {
  const settings = {
    dots: !hasIframe,
    infinite: !hasIframe,
    autoplaySpeed: 5000,
    autoplay: !hasIframe,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <Slider {...settings} className={`relative w-full overflow-hidden ${cursorClass(hasIframe)}`}>
      {
        heros.map((hero, index) => (
          <RenderBlock
            block={hero}
            hasIframe={hasIframe}
            seq={startIndex + index}
            key={`${hero.id}-${startIndex + index}`}
          />
        ))
      }
    </Slider>
  );
}
