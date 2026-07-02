export const locales = ['en', 'hk'] as const;
export type Locale = (typeof locales)[number];

const envLocale = process.env.GO_TECH_LANGUAGE;
export const defaultLocale: Locale = envLocale === 'en' || envLocale === 'hk' ? envLocale : 'hk';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hk: '中文'
};
