import { createMobileHandoffHandlers } from '@/lib/auth/mobile-handoff';
import { mobileHandoffStore } from '@/lib/auth/mobile-handoff-store';

export const runtime = 'nodejs';
const handlers = createMobileHandoffHandlers(mobileHandoffStore);
export function GET(request: Request) {
  return handlers.redirect(request);
}

/** 普通浏览器先带 Authorization 请求此接口，再用返回的短地址进行页面导航。 */
export function POST(request: Request) {
  return handlers.redirect(request, 'json');
}
