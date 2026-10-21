import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRuntimeConfig } from '@/lib/runtime-config/server';

const hreflangByLocale: Record<Locale, string> = {
  'en-us': 'en-US',
  'zh-hk': 'zh-HK',
  'zh-cn': 'zh-CN'
};

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

function getLocalizedPathname(locale: Locale, pathname: string, defaultLocale: string): string {
  if (locale === defaultLocale) return pathname;

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

function getAbsoluteUrl(pathname: string, siteUrl: URL): string {
  return new URL(pathname, siteUrl).toString();
}

export async function getLocalizedAlternates(
  locale: Locale,
  requestPathname: string | null
): Promise<NonNullable<Metadata['alternates']>> {
  const { values } = await getRuntimeConfig();
  const defaultLocale = values.GO_TECH_LANGUAGE ?? 'zh-hk';
  const siteUrl = new URL(values.NEXT_PUBLIC_SITE_URL ?? 'https://go-techs.com');
  const pathname = normalizePathname(requestPathname);
  const languages = Object.fromEntries(
    routing.locales.map(candidate => [
      hreflangByLocale[candidate],
      getAbsoluteUrl(getLocalizedPathname(candidate, pathname, defaultLocale), siteUrl)
    ])
  );

  languages['x-default'] = getAbsoluteUrl(
    getLocalizedPathname(defaultLocale as Locale, pathname, defaultLocale),
    siteUrl
  );

  return {
    canonical: getAbsoluteUrl(getLocalizedPathname(locale, pathname, defaultLocale), siteUrl),
    languages
  };
}
