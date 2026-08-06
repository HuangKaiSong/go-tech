import { streamFeedbackAnswer } from '@go-tech/feedback-ai';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

function encodeEvent(encoder: TextEncoder, event: Record<string, unknown>) {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const result = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json({ success: false, message: '問題或對話上下文格式無效' }, { status: 400 });
  }

  const answer = streamFeedbackAnswer({
    history: result.data.history,
    question: result.data.question,
    userId: `admin:${auth.admin.id}`
  });
  const iterator = answer[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async cancel() {
      closed = true;
      await iterator.return?.(undefined);
    },
    async pull(controller) {
      if (closed) return;

      try {
        const next = await iterator.next();
        if (next.done) {
          closed = true;
          controller.enqueue(encodeEvent(encoder, { type: 'done' }));
          controller.close();
          return;
        }

        controller.enqueue(encodeEvent(encoder, { type: 'token', content: next.value }));
      } catch (error) {
        console.error('Feedback assistant stream failed', error);
        closed = true;
        controller.enqueue(encodeEvent(encoder, { type: 'error', message: 'AI 助手暫時無法回應，請稍後再試' }));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    }
  });
}
