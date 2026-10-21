import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { AUTH_TOKEN_COOKIE, buildLoginRedirectUrl, isProtectedPagePathname } from '@/lib/auth/auth-redirect';
import type { ConfigValues } from './definitions';
export function createH5Proxy(readConfig: () => Promise<{ values: ConfigValues }>) {
  return async function proxy(request: NextRequest) {
    const { values } = await readConfig();
    if (/^\/(go-tech|pms-resource|pms-admin)(\/|$)/.test(request.nextUrl.pathname)) {
      const base = values.NEXT_PUBLIC_API_URL;
      if (!base) return NextResponse.json({ code: 503, message: '业务接口未配置' }, { status: 503 });
      return NextResponse.rewrite(
        new URL(`${base.replace(/\/$/, '')}${request.nextUrl.pathname}${request.nextUrl.search}`)
      );
    }
    const language = values.GO_TECH_LANGUAGE;
    const defaultLocale = language === 'en-us' || language === 'zh-cn' ? language : 'zh-hk';
    const handleI18nRouting = createMiddleware({ ...routing, defaultLocale });
    if (isProtectedPagePathname(request.nextUrl.pathname) && !request.cookies.get(AUTH_TOKEN_COOKIE)?.value) {
      return NextResponse.redirect(buildLoginRedirectUrl(request.nextUrl));
    }

    request.headers.set('x-go-tech-pathname', request.nextUrl.pathname);

    return handleI18nRouting(request);
  };
}
