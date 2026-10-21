export const locales = ['en-us', 'zh-hk', 'zh-cn'] as const;
export type Locale = (typeof locales)[number];

// Runtime default is supplied by proxy, navigation and SEO. This is a bootstrap fallback only.
export const defaultLocale: Locale = 'zh-hk';

export const localeNames: Record<Locale, string> = {
  'en-us': 'English',
  'zh-hk': '繁體中文',
  'zh-cn': '简体中文'
};
