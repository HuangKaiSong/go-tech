import { withRuntimeScope } from '@/db';
import { createMobileHandoffHandlers } from '@/lib/auth/mobile-handoff';
import { mobileHandoffStore } from '@/lib/auth/mobile-handoff-store';

export const runtime = 'nodejs';
const handlers = createMobileHandoffHandlers(mobileHandoffStore);
const handlePOST = handlers.exchange;
const handleOPTIONS = handlers.exchange;

export const POST = withRuntimeScope(handlePOST);
export const OPTIONS = withRuntimeScope(handleOPTIONS);
