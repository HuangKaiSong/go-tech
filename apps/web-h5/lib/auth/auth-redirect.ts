import { locales } from '../../i18n/config';

export const AUTH_TOKEN_COOKIE = 'GO_TECH_AUTH_TOKEN';

const PROTECTED_PAGE_PREFIXES = [
  '/confirm-order',
  '/invoice',
  '/my-orders',
  '/renew-order',
  '/select-account',
  '/select-plan',
  '/settings'
] as const;

interface CurrentLocation {
  hash?: string;
  origin: string;
  pathname: string;
  search: string;
}

function splitLocalePathname(pathname: string) {
  const firstSegment = pathname.split('/')[1];
  const locale = locales.find(candidate => candidate === firstSegment);

  if (!locale) return { localePrefix: '', pathname };

  return {
    localePrefix: `/${locale}`,
    pathname: pathname.slice(locale.length + 1) || '/'
  };
}

function isPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isLoginPagePathname(pathname: string) {
  return splitLocalePathname(pathname).pathname === '/account/login';
}

export function isProtectedPagePathname(pathname: string) {
  const localizedPathname = splitLocalePathname(pathname).pathname;
  return PROTECTED_PAGE_PREFIXES.some(prefix => isPathPrefix(localizedPathname, prefix));
}

export function buildLoginRedirectUrl(currentLocation: CurrentLocation) {
  const { localePrefix } = splitLocalePathname(currentLocation.pathname);
  const loginUrl = new URL(`${localePrefix}/account/login`, currentLocation.origin);
  const returnPath = `${currentLocation.pathname}${currentLocation.search}${currentLocation.hash || ''}`;

  loginUrl.searchParams.set('redirect', returnPath);
  return loginUrl;
}

/** 只允许登录后跳回站内页面，避免 redirect 查询参数成为开放重定向入口。 */
export function getSafePostLoginPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return null;

  try {
    const target = new URL(redirect, 'https://local.invalid');
    if (target.origin !== 'https://local.invalid' || isLoginPagePathname(target.pathname)) return null;

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function redirectBrowserToLogin() {
  if (typeof window === 'undefined' || isLoginPagePathname(window.location.pathname)) return;

  window.location.replace(buildLoginRedirectUrl(window.location).href);
}
