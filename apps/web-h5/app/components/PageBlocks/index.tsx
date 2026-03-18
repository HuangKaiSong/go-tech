"use client";

import Link from "@/app/components/Link";
import { Button } from "@go-tech-frontend/ui";
import {
  Building2,
  Calculator,
  DollarSign,
  FileText,
  LayoutGrid,
  PenTool,
  Receipt,
  RefreshCw,
  Store,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { CSSProperties, ReactNode } from "react";
import Hero, { HeroBlock } from "./Hero";

type BlockBase = {
  id: string;
  type: string;
};

type SectionBlock = BlockBase & {
  type: "section";
  title: string;
  titleStyle?: CSSProperties;
  lineStyle?: CSSProperties;
  intro: string;
  introStyle?: CSSProperties;
}

type CommonBlock = BlockBase & {
  type: "common";
  image?: string;
  values: Record<string, string>;
};

type FeatureGridBlock = BlockBase & {
  type: "featureGrid";
  title: string;
  subtitle: string;
  items: { icon: keyof typeof iconMap; label: string }[];
};

type TextBlock = BlockBase & {
  type: "text";
  text: string;
  align?: CSSProperties["textAlign"];
};

type ButtonBlock = BlockBase & {
  type: "button";
  text: string;
  href: string;
  buttonStyle?: CSSProperties;
};

type ImageBlock = BlockBase & {
  type: "image";
  src: string;
  alt: string;
};

export type PageBlock =
  | SectionBlock
  | CommonBlock 
  | HeroBlock
  | FeatureGridBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock;

const iconMap = {
  Users,
  Building2,
  FileText,
  DollarSign,
  UserCog,
  LayoutGrid,
  Store,
  Wallet,
  Calculator,
  Receipt,
  RefreshCw,
  PenTool,
};

const getAlignClass = (align?: CSSProperties["textAlign"]) => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
};

const cursorClass = (hasIframe: boolean) => (hasIframe ? "cursor-editor" : "");

export const PageBlocks = ({
  blocks,
  hasIframe,
}: {
  blocks: PageBlock[];
  hasIframe: boolean;
}) => {
  const renderedBlocks: ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.type === "hero") {
      const heroStartIndex = i;
      const heros: HeroBlock[] = [block];

      while (i + 1 < blocks.length && blocks[i + 1].type === "hero") {
        heros.push(blocks[i + 1] as HeroBlock);
        i += 1;
      }

      renderedBlocks.push(
        <Hero
          key={heros.map((hero) => hero.id).join("-")}
          heros={heros}
          hasIframe={hasIframe}
          startIndex={heroStartIndex}
        />,
      );

      continue;
    }

    if (block.type === "featureGrid") {
      renderedBlocks.push(
        <section key={block.id} className="py-16 md:py-24 flex-1">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2
                className={`text-3xl font-bold text-foreground mb-4 ${cursorClass(hasIframe)}`}
              >
                {block.title}
              </h2>
              <p className={`text-muted-foreground mb-12 ${cursorClass(hasIframe)}`}>
                {block.subtitle}
              </p>

              <div
                className={`grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 ${cursorClass(hasIframe)}`}
              >
                {block.items.map((feature, index) => {
                  const Icon = iconMap[feature.icon];
                  return (
                    <div key={index} className="flex flex-col items-start">
                      <div
                        className="w-full aspect-4/3 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: "#F9F9F9" }}
                      >
                        <Icon
                          className="w-24 h-24"
                          style={{ color: "#F5734A" }}
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {feature.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>,
      );

      continue;
    }

    if (block.type === "text") {
      renderedBlocks.push(
        <section key={block.id} className="py-6">
          <div className="container mx-auto px-4">
            <p
              data-block-id={block.id}
              data-block-role="text"
              className={`text-base text-foreground ${getAlignClass(block.align)} ${cursorClass(hasIframe)}`}
            >
              {block.text}
            </p>
          </div>
        </section>,
      );

      continue;
    }

    if (block.type === "button") {
      renderedBlocks.push(
        <section key={block.id} className="py-6">
          <div className="container mx-auto px-4">
            <Link href={block.href}>
              <Button
                data-block-id={block.id}
                data-block-role="buttonText"
                data-block-link={block.href}
                className={cursorClass(hasIframe)}
                style={block.buttonStyle}
              >
                {block.text}
              </Button>
            </Link>
          </div>
        </section>,
      );

      continue;
    }

    if (block.type === "image") {
      renderedBlocks.push(
        <section key={block.id} className="py-6">
          <div className="container mx-auto px-4">
            <img
              data-block-id={block.id}
              data-block-role="image"
              className={`w-full h-auto rounded-xl ${cursorClass(hasIframe)}`}
              src={block.src}
              alt={block.alt}
            />
          </div>
        </section>,
      );
    }
  }

  return <div className="flex flex-col w-full h-full">{renderedBlocks}</div>;
};
