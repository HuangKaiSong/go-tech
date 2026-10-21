import { NextResponse } from 'next/server';
import { clearCache } from '@/app/lib/translation/cache';
import { withRuntimeScope } from '@/db';

async function handlePOST() {
  clearCache();
  return NextResponse.json({ ok: true });
}

export const POST = withRuntimeScope(handlePOST);
