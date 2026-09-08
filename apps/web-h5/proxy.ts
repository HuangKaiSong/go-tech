import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … backend API paths handled by next.config.ts rewrites
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|(?:go-tech|pms-resource|pms-admin)(?:/|$)|.*\\..*).*)'
};

export default function proxy(request: NextRequest) {
  request.headers.set('x-go-tech-pathname', request.nextUrl.pathname);

  return handleI18nRouting(request);
}
