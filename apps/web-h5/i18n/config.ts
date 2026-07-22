export const locales = ['en-us', 'zh-hk', 'zh-cn'] as const;
export type Locale = (typeof locales)[number];

const envLocale = process.env.GO_TECH_LANGUAGE;
export const defaultLocale: Locale =
  envLocale === 'en-us' || envLocale === 'zh-hk' || envLocale === 'zh-cn' ? envLocale : 'zh-hk';

export const localeNames: Record<Locale, string> = {
  'en-us': 'English',
  'zh-hk': '繁體中文',
  'zh-cn': '简体中文'
};
