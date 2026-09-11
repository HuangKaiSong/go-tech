import { type NextRequest, NextResponse } from 'next/server';
import { fetchFeedbackAi } from '@/app/api/feedback/ai-client';
import { requireFeedbackAdmin } from '../../auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const userId = encodeURIComponent(`admin:${auth.admin.id}`);
  const upstream = await fetchFeedbackAi(`/v1/modules/feedback/conversations?user_id=${userId}&limit=50`).catch(
    error => {
      console.error('Could not load Feedback AI conversations', error);
      return undefined;
    }
  );
  if (!upstream?.ok) {
    if (upstream) console.error('Feedback AI service returned', upstream.status, await upstream.text());
    return NextResponse.json({ success: false, message: '無法載入歷史對話' }, { status: 502 });
  }
  return NextResponse.json({ success: true, data: await upstream.json() });
}
