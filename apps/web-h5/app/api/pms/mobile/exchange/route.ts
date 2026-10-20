import { createMobileHandoffHandlers } from '@/lib/auth/mobile-handoff';
import { mobileHandoffStore } from '@/lib/auth/mobile-handoff-store';

export const runtime = 'nodejs';
const handlers = createMobileHandoffHandlers(mobileHandoffStore);
export const POST = handlers.exchange;
export const OPTIONS = handlers.exchange;
