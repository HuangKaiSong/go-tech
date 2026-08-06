import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { enqueueFeedbackSync, scheduleFeedbackSync } from '@/app/api/feedback/sync';
import { db } from '@/db';
import { fbComment, fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../../auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const commentId = Number((await params).commentId);
  if (!Number.isSafeInteger(commentId) || commentId <= 0) {
    return NextResponse.json({ success: false, message: '無效的評論 ID' }, { status: 400 });
  }

  const result = await db.transaction(async tx => {
    const target = await tx.query.fbComment.findFirst({ where: eq(fbComment.id, commentId) });
    if (!target) return null;
    if (target.deletedAt) {
      await enqueueFeedbackSync(tx, target.featureId);
      return { affected: 0, featureId: target.featureId };
    }

    const cascadeRows = target.isOfficial
      ? []
      : await tx.query.fbComment.findMany({
          where: and(eq(fbComment.parentId, target.id), eq(fbComment.isOfficial, true), isNull(fbComment.deletedAt)),
          columns: { id: true, isVisible: true }
        });
    const ids = [target.id, ...cascadeRows.map(row => row.id)];
    const activeVisibleCount = (target.isVisible ? 1 : 0) + cascadeRows.filter(row => row.isVisible).length;
    const deletedAt = new Date();
    await tx
      .update(fbComment)
      .set({ deletedAt, deletedBy: auth.admin.id })
      .where(and(inArray(fbComment.id, ids), isNull(fbComment.deletedAt)));
    if (activeVisibleCount > 0) {
      await tx
        .update(fbFeature)
        .set({ commentCount: sql`greatest(${fbFeature.commentCount} - ${activeVisibleCount}, 0)` })
        .where(eq(fbFeature.id, target.featureId));
    }
    await enqueueFeedbackSync(tx, target.featureId);
    return { affected: ids.length, featureId: target.featureId };
  });

  if (!result) return NextResponse.json({ success: false, message: '評論不存在' }, { status: 404 });
  scheduleFeedbackSync();
  return NextResponse.json({ success: true, data: { id: String(commentId), deleted: true } });
}
