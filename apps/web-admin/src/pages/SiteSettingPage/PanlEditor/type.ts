import { CSSProperties } from "react";

export enum BlockType {
  Common = "common",
  Hero = "hero",
  Text = "text",
  Button = "button",
  Image = "image",
}

export enum PageKey {
  Common = "common",
  Home = "home",
  SystemFeatures = "system-features",
  TargetAudience = "target-audience",
  CoreAdvantages = "core-advantages",
}

export type SelectedElementInfo = {
  id: string;
  tagName: string;
  className: string;
  innerHTML: string;
  outerHTML: string;
  dataset?: Record<string, string>;
};

export type AdminBlockBase = {
  id: string;
  type: BlockType;
};

export type CommonBlock = AdminBlockBase & {
  type: BlockType.Common;
  image?: string;
  title?: string;
  content?: string;
  values?: Record<string, string>;
}

export type AdminHeroBlock = AdminBlockBase & {
  type: BlockType.Hero;
  title: string;
  titleSecondary?: string;
  subtitle: string;
  titleStyle?: CSSProperties;
  titleSecondaryStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage: string;
  overlayGradient?: string;
  buttonStyle?: string;
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
};

export type AdminTextBlock = AdminBlockBase & {
  type: BlockType.Text;
  text: string;
  align?: CSSProperties["textAlign"];
};

export type AdminButtonBlock = AdminBlockBase & {
  type: BlockType.Button;
  text: string;
  href: string;
  buttonStyle?: CSSProperties;
};

export type AdminImageBlock = AdminBlockBase & {
  type: BlockType.Image;
  src: string;
  alt: string;
};

export type AdminBlock =
  | CommonBlock
  | AdminHeroBlock
  | AdminTextBlock
  | AdminButtonBlock
  | AdminImageBlock;
