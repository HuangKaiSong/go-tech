import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/app/lib/translation/types';
import { withRuntimeScope } from '@/db';
import { captureServerRouteError } from '@/lib/browser-monitor/server';
import { translate } from '../../lib/translation';

async function handleGET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const locale = searchParams.get('locale') as Locale;

  if (!text || !locale) {
    return NextResponse.json({ error: 'Missing text or locale parameter' }, { status: 400 });
  }

  try {
    const translated = await translate(text, locale);
    return NextResponse.json({ result: translated });
  } catch (error) {
    await captureServerRouteError(error, request);
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

export const GET = withRuntimeScope(handleGET);
