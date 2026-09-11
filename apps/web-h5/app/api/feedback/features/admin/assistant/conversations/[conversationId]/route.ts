import { type NextRequest, NextResponse } from 'next/server';
import { fetchFeedbackAi } from '@/app/api/feedback/ai-client';
import { requireFeedbackAdmin } from '../../../auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

async function proxyConversation(req: NextRequest, context: RouteContext, method: 'DELETE' | 'GET') {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const { conversationId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(conversationId)) {
    return NextResponse.json({ success: false, message: '無效的對話 ID' }, { status: 400 });
  }
  const userId = encodeURIComponent(`admin:${auth.admin.id}`);
  const upstream = await fetchFeedbackAi(
    `/v1/modules/feedback/conversations/${encodeURIComponent(conversationId)}?user_id=${userId}`,
    { method }
  ).catch(error => {
    console.error(`Could not ${method.toLowerCase()} Feedback AI conversation`, error);
    return undefined;
  });
  if (!upstream?.ok) {
    const status = upstream?.status === 404 ? 404 : 502;
    if (upstream) console.error('Feedback AI service returned', upstream.status, await upstream.text());
    return NextResponse.json(
      { success: false, message: status === 404 ? '歷史對話不存在' : '歷史對話服務暫時不可用' },
      { status }
    );
  }
  return NextResponse.json({ success: true, data: await upstream.json() });
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyConversation(req, context, 'GET');
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyConversation(req, context, 'DELETE');
}
