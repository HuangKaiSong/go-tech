import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFeedbackAi } from '@/app/api/feedback/ai-client';
import { requireFeedbackAdmin } from '../../auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const chatRequestSchema = z.object({
  history: z
    .array(
      z.object({
        content: z.string().trim().min(1).max(12_000),
        role: z.enum(['assistant', 'user'])
      })
    )
    .max(16)
    .optional(),
  question: z.string().trim().min(1).max(4_000)
});

export async function POST(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const result = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json({ success: false, message: '問題或對話上下文格式無效' }, { status: 400 });
  }

  const upstream = await fetchFeedbackAi('/v1/chat', {
    body: JSON.stringify({
      history: result.data.history ?? [],
      question: result.data.question,
      user_id: `admin:${auth.admin.id}`
    }),
    method: 'POST',
    signal: req.signal
  }).catch(error => {
    console.error('Feedback AI service could not be reached', error);
    return undefined;
  });

  if (!upstream?.ok || !upstream.body) {
    if (upstream) console.error('Feedback AI service returned', upstream.status, await upstream.text());
    return NextResponse.json({ success: false, message: 'AI 助手暫時無法回應，請稍後再試' }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    }
  });
}
