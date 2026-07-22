import { clearCache } from '@/app/lib/translation/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { locale } = await request.json();

  const cookieStore = await cookies();

  cookieStore.set('GO_TECH_LANGUAGE', locale, {
    path: '/'
  });

  clearCache()

  return NextResponse.json({ success: true });
}
