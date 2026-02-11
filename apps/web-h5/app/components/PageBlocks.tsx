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
import { CSSProperties } from "react";

type BlockBase = {
  id: string;
  type: string;
};

type HeroBlock = BlockBase & {
  type: "hero";
  title: string;
  titleSecondary?: string;
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
  return (
    <div className="flex flex-col w-full h-full">
      {blocks.map((block) => {
        if (block.type === "hero") {
          const sectionStyle = block.sectionStyle || {
            paddingTop: '8rem',
            paddingBottom: '8rem',
          }

          return (
            <section
              key={block.id}
              className={`relative flex-1`}
              style={sectionStyle}
              >
              {/* <div className="absolute w-full h-full z-10 inset-0 bg-linear-to-r from-foreground/70 to-transparent" /> */}
              <div
                data-block-id={block.id}
                data-block-role="background"
                className={`absolute w-full h-full inset-0 bg-size_100 bg-center bg-cover ${cursorClass(hasIframe)}`}
                style={{
                  backgroundImage: `url(${block.backgroundImage})`,
                }}
              />
              <div className="container h-full mx-auto px-4 relative z-10 bg-transparent">
                <div style={block.contentStyle}>
                  <h1
                    data-block-id={block.id}
                    data-block-role="title"
                    className={`text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line ${cursorClass(hasIframe)}`}
                    style={block.titleStyle}
                    dangerouslySetInnerHTML={{ __html: block.title }}
                  />
                  {block.titleSecondary ? (
                    <h2
                      data-block-id={block.id}
                      data-block-role="titleSecondary"
                      className={`text-4xl md:text-5xl font-bold text-white mb-6 ${cursorClass(hasIframe)}`}
                      style={block.titleSecondaryStyle}
                      dangerouslySetInnerHTML={{ __html: block.titleSecondary }}
                    />
                  ) : null}
                  <p
                    data-block-id={block.id}
                    data-block-role="subtitle"
                    className={`${cursorClass(hasIframe)}`}
                    style={block.subtitleStyle}
                  >
                    {block.subtitle}
                  </p>
                  {block.buttonText && block.buttonLink ? (
                    <Link href={block.buttonLink}>
                      <Button
                        data-block-id={block.id}
                        data-block-role="buttonText"
                        data-block-link={block.buttonLink}
                        size="lg"
                        className={`${cursorClass(hasIframe)}`}
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

        if (block.type === "featureGrid") {
          return (
            <section key={block.id} className="py-16 md:py-24 flex-1">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2
                    className={`text-3xl font-bold text-foreground mb-4 ${cursorClass(hasIframe)}`}
                  >
                    {block.title}
                  </h2>
                  <p
                    className={`text-muted-foreground mb-12 ${cursorClass(hasIframe)}`}
                  >
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
            </section>
          );
        }

        if (block.type === "text") {
          return (
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
            </section>
          );
        }

        if (block.type === "button") {
          return (
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
            </section>
          );
        }

        if (block.type === "image") {
          return (
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
            </section>
          );
        }

        return null;
      })}
    </div>
  );
};
