import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';

const DEFAULT_SITE_URL = 'https://go-techs.com';

const hreflangByLocale: Record<Locale, string> = {
  'en-us': 'en-US',
  'zh-hk': 'zh-HK',
  'zh-cn': 'zh-CN'
};

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL);

function normalizePathname(pathname: string | null): string {
  const pathnameWithoutQuery = pathname?.split(/[?#]/, 1)[0] || '/';
  const pathnameWithLeadingSlash = pathnameWithoutQuery.startsWith('/')
    ? pathnameWithoutQuery
    : `/${pathnameWithoutQuery}`;
  const locale = routing.locales.find(
    candidate => pathnameWithLeadingSlash === `/${candidate}` || pathnameWithLeadingSlash.startsWith(`/${candidate}/`)
  );
  const pathnameWithoutLocale = locale
    ? pathnameWithLeadingSlash.slice(locale.length + 1) || '/'
    : pathnameWithLeadingSlash;
  const normalizedPathname = pathnameWithoutLocale.replace(/\/{2,}/g, '/');

  return normalizedPathname.length > 1 ? normalizedPathname.replace(/\/$/, '') : normalizedPathname;
}

function getLocalizedPathname(locale: Locale, pathname: string): string {
  if (locale === routing.defaultLocale) return pathname;

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteUrl).toString();
}

export function getLocalizedAlternates(
  locale: Locale,
  requestPathname: string | null
): NonNullable<Metadata['alternates']> {
  const pathname = normalizePathname(requestPathname);
  const languages = Object.fromEntries(
    routing.locales.map(candidate => [
      hreflangByLocale[candidate],
      getAbsoluteUrl(getLocalizedPathname(candidate, pathname))
    ])
  );

  languages['x-default'] = getAbsoluteUrl(getLocalizedPathname(routing.defaultLocale, pathname));

  return {
    canonical: getAbsoluteUrl(getLocalizedPathname(locale, pathname)),
    languages
  };
}
