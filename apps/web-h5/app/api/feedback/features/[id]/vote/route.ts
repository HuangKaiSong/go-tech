import { and, eq, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbFeature, fbVote } from '@/db/scheam';
import { getFeedbackUser } from '../../../auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getFeedbackUser();
  if (!user) {
    return NextResponse.json({ success: false, message: '請先登入後再操作' }, { status: 401 });
  }

  const featureId = Number((await params).id);
  if (!Number.isSafeInteger(featureId) || featureId <= 0) {
    return NextResponse.json({ success: false, message: '無效的需求' }, { status: 400 });
  }

  const result = await db.transaction(async tx => {
    const feature = await tx.query.fbFeature.findFirst({
      where: and(eq(fbFeature.id, featureId), isNull(fbFeature.deletedAt)),
      columns: { id: true }
    });
    if (!feature) return null;

    const existingVote = await tx.query.fbVote.findFirst({
      where: and(eq(fbVote.featureId, featureId), eq(fbVote.userId, user.id)),
      columns: { id: true }
    });

    if (existingVote) {
      await tx.delete(fbVote).where(eq(fbVote.id, existingVote.id));
      await tx
        .update(fbFeature)
        .set({ likeCount: sql`GREATEST(${fbFeature.likeCount} - 1, 0)` })
        .where(eq(fbFeature.id, featureId));
    } else {
      await tx.insert(fbVote).values({ featureId, userId: user.id });
      await tx
        .update(fbFeature)
        .set({ likeCount: sql`${fbFeature.likeCount} + 1` })
        .where(eq(fbFeature.id, featureId));
    }

    const updated = await tx.query.fbFeature.findFirst({
      where: eq(fbFeature.id, featureId),
      columns: { likeCount: true }
    });
    return { liked: !existingVote, likes: updated?.likeCount ?? 0, userName: user.custName };
  });

  if (!result) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: result });
}
