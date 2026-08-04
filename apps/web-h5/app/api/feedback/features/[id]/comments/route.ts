import { and, eq, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbComment, fbFeature } from '@/db/scheam';
import { getFeedbackUser } from '../../../auth';
import { moderateFeedbackContent } from '../../../moderation';
import { verifyBotToken } from '../../../turnstile';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getFeedbackUser();
  if (!user) {
    return NextResponse.json({ success: false, message: '請先登入後再操作' }, { status: 401 });
  }

  const featureId = Number((await params).id);
  const body = (await req.json().catch(() => null)) as { content?: unknown; turnstileToken?: unknown } | null;
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const turnstileToken = typeof body?.turnstileToken === 'string' ? body.turnstileToken : '';
  if (!Number.isSafeInteger(featureId) || featureId <= 0 || !content || content.length > 1000) {
    return NextResponse.json({ success: false, message: '留言內容無效' }, { status: 400 });
  }

  if (!(await verifyBotToken(turnstileToken, 'feedback_comment'))) {
    return NextResponse.json(
      { success: false, code: 'BOT_VERIFICATION_FAILED', message: '機器人驗證失敗，請重試' },
      { status: 400 }
    );
  }

  const moderation = moderateFeedbackContent([content]);
  if (!moderation.allowed) {
    return NextResponse.json(
      { success: false, code: 'CONTENT_REJECTED', message: '留言未通過安全審核，請修改後重試' },
      { status: 422 }
    );
  }

  const comment = await db.transaction(async tx => {
    const feature = await tx.query.fbFeature.findFirst({
      where: and(eq(fbFeature.id, featureId), isNull(fbFeature.deletedAt)),
      columns: { id: true }
    });
    if (!feature) return null;

    const [insertResult] = await tx.insert(fbComment).values({
      authorId: user.id,
      content,
      featureId
    });
    await tx
      .update(fbFeature)
      .set({ commentCount: sql`${fbFeature.commentCount} + 1` })
      .where(eq(fbFeature.id, featureId));

    return {
      author: user.custName,
      content,
      createdAt: new Date().toISOString(),
      id: String(insertResult.insertId),
      isOfficial: false
    };
  });

  if (!comment) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: comment });
}
