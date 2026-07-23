import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { translateWithDeepL } from '@/app/lib/translation/translator';

z.config(z.locales.zhCN());

const bodySchema = z.object({
  locale: z.enum(['zh-cn', 'zh-hk', 'en-us']),
  text: z.string().array().min(1)
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = bodySchema.safeParse(body);

  if (error) {
    return NextResponse.json(z.flattenError(error).fieldErrors, { status: 400 });
  }

  const result = await translateWithDeepL(data.text, data.locale);

  return NextResponse.json(result);
}
