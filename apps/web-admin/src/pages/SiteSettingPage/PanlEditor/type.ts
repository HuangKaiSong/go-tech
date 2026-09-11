import { type CSSProperties } from 'react';

export enum BlockType {
  Audiences = 'audiences',
  Button = 'button',
  Common = 'common',
  Hero = 'hero',
  Image = 'image',
  Section = 'section',
  Text = 'text'
}

export enum PageKey {
  Common = 'common',
  CoreAdvantages = 'core-advantages',
  Home = 'home',
  SystemFeatures = 'system-features',
  TargetAudience = 'target-audience'
}

export type SelectedElementInfo = {
  className: string;
  dataset?: Record<string, string>;
  id: string;
  innerHTML: string;
  outerHTML: string;
  tagName: string;
};

export type AdminBlockBase = {
  id: string;
  type: BlockType;
};

export type CommonBlock = AdminBlockBase & {
  content?: string;
  image?: string;
  title?: string;
  type: BlockType.Common;
  values?: Record<string, string>;
};

export type AdminSectionProduct = {
  intro: string;
  key: HeroProductKey;
  title: string;
};

export type AdminSectionBlock = AdminBlockBase & {
  intro: string;
  introStyle?: CSSProperties;
  lineStyle?: CSSProperties;
  products?: AdminSectionProduct[];
  title: string;
  titleStyle?: CSSProperties;
  type: BlockType.Section;
};

export type AdminAudienceItem = {
  description: string;
  image?: string;
  initialSrc: string;
  sort: number | string;
  title: string;
};

export type AdminAudienceProduct = {
  audiences: AdminAudienceItem[];
  key: HeroProductKey;
};

export type AdminAudienceBlock = AdminBlockBase & {
  audiences?: AdminAudienceItem[];
  products?: AdminAudienceProduct[];
  type: BlockType.Audiences;
};

export type HeroProductKey = 'hr' | 'pms';

export type AdminHeroProduct = {
  backgroundImage: string;
  backgroundImageAlt?: string;
  detailButtonLink: string;
  detailButtonText: string;
  key: HeroProductKey;
  label: string;
  subtitle: string;
  title: string;
  titleSecondary: string;
  trialButtonLink: string;
  trialButtonText: string;
};

export type AdminHeroBlock = AdminBlockBase & {
  backgroundImage: string;
  buttonLink?: string;
  buttonStyle?: string;
  buttonText?: string;
  contentStyle?: CSSProperties;
  defaultProduct?: HeroProductKey;
  overlayGradient?: string;
  products?: AdminHeroProduct[];
  productSwitcherPlacement?: 'below-hero' | 'hero';
  sectionStyle?: CSSProperties;
  subtitle: string;
  subtitleStyle?: CSSProperties;
  title: string;
  titleSecondary?: string;
  titleSecondaryStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  type: BlockType.Hero;
  variant?: 'default' | 'product-switcher';
};

export type AdminTextBlock = AdminBlockBase & {
  align?: CSSProperties['textAlign'];
  text: string;
  type: BlockType.Text;
};

export type AdminButtonBlock = AdminBlockBase & {
  buttonStyle?: CSSProperties;
  href: string;
  text: string;
  type: BlockType.Button;
};

export type AdminImageBlock = AdminBlockBase & {
  alt: string;
  src: string;
  type: BlockType.Image;
};

export type AdminBlock =
  | CommonBlock
  | AdminAudienceBlock
  | AdminHeroBlock
  | AdminSectionBlock
  | AdminTextBlock
  | AdminButtonBlock
  | AdminImageBlock;
