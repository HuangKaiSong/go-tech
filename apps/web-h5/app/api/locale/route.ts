import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearCache } from '@/app/lib/translation/cache';
import { withRuntimeScope } from '@/db';

async function handlePOST(request: Request) {
  const { locale } = await request.json();

  const cookieStore = await cookies();

  cookieStore.set('GO_TECH_LANGUAGE', locale, {
    path: '/'
  });

  clearCache();

  return NextResponse.json({ success: true });
}

export const POST = withRuntimeScope(handlePOST);
