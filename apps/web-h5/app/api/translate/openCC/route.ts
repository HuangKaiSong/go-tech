import { translateWithOpenCC } from "@/app/lib/translation/translator";
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod'

z.config(z.locales.zhCN())

const bodySchema = z.object({
  locale: z.enum(['cn', 'hk', 'tw', 't']),
  text: z.string()
})

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = bodySchema.safeParse(body);

  if (error) {
    return NextResponse.json(z.flattenError(error).fieldErrors, { status: 400 })
  }

  const result: Record<string, string> = {};

  result[data.text] = translateWithOpenCC(data.text, data.locale)

  return NextResponse.json(result)
}
