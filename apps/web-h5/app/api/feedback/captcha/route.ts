import { type NextRequest, NextResponse } from 'next/server';
import { type BotVerificationAction, createFallbackCaptcha } from '../fallback-captcha';

const validActions: BotVerificationAction[] = ['feedback_comment', 'feedback_post'];

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') as BotVerificationAction | null;
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ success: false, message: '無效的驗證場景' }, { status: 400 });
  }

  const captcha = await createFallbackCaptcha(action);
  if (!captcha) {
    return NextResponse.json({ success: false, message: '備用驗證尚未配置' }, { status: 503 });
  }

  return NextResponse.json({ success: true, data: captcha }, { headers: { 'Cache-Control': 'no-store' } });
}
