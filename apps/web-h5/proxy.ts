import { withRuntimeScope } from '@/db';
import { createH5Proxy } from '@/lib/runtime-config/routing';
import { getRuntimeConfig } from '@/lib/runtime-config/server';
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/go-tech/:path*', '/pms-resource/:path*', '/pms-admin/:path*', '/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};

export default withRuntimeScope(createH5Proxy(getRuntimeConfig));
