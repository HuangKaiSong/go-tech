import { type NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/app/lib/translation/types';
import { translateBatch } from '../../../lib/translation';

export const runtime = 'nodejs';

const SUPPORTED_LOCALES = new Set<Locale>(['en-us', 'zh-cn', 'zh-hk']);

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.has(value as Locale);
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { locale, texts } = body as Record<string, unknown>;

  if (!Array.isArray(texts) || texts.length === 0 || !texts.every(text => typeof text === 'string')) {
    return NextResponse.json({ error: 'Invalid texts' }, { status: 400 });
  }

  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  try {
    const translations = await translateBatch(texts, locale as Locale);
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Batch translation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
