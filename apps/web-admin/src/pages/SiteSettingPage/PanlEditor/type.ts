import { type CSSProperties } from 'react';

export enum BlockType {
  Button = 'button',
  Common = 'common',
  Hero = 'hero',
  Image = 'image',
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

export type AdminHeroBlock = AdminBlockBase & {
  backgroundImage: string;
  buttonLink?: string;
  buttonStyle?: string;
  buttonText?: string;
  contentStyle?: CSSProperties;
  overlayGradient?: string;
  sectionStyle?: CSSProperties;
  subtitle: string;
  subtitleStyle?: CSSProperties;
  title: string;
  titleSecondary?: string;
  titleSecondaryStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  type: BlockType.Hero;
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

export type AdminBlock = CommonBlock | AdminHeroBlock | AdminTextBlock | AdminButtonBlock | AdminImageBlock;
