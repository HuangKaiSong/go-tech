import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { translateWithOpenCC } from '@/app/lib/translation/translator';
import { withRuntimeScope } from '@/db';

z.config(z.locales.zhCN());

const bodySchema = z.object({
  locale: z.enum(['cn', 'hk', 'tw', 't']),
  text: z.string()
});

async function handlePOST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = bodySchema.safeParse(body);

  if (error) {
    return NextResponse.json(z.flattenError(error).fieldErrors, { status: 400 });
  }

  const result: Record<string, string> = {};

  result[data.text] = await translateWithOpenCC(data.text, data.locale);

  return NextResponse.json(result);
}

export const POST = withRuntimeScope(handlePOST);
