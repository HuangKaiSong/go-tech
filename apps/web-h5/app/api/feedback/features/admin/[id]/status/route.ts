import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { enqueueFeedbackSync, scheduleFeedbackSync } from '@/app/api/feedback/sync';
import { db } from '@/db';
import { fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../../auth';
import { isFeatureStatus } from '../../shared';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const featureId = Number((await params).id);
  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  if (!Number.isSafeInteger(featureId) || featureId <= 0 || !isFeatureStatus(body?.status)) {
    return NextResponse.json({ success: false, message: '需求 ID 或狀態無效' }, { status: 400 });
  }
  const status = body.status;

  const result = await db.transaction(async tx => {
    const updateResult = await tx
      .update(fbFeature)
      .set({
        status,
        shippedAt: status === 'shipped' ? new Date() : null
      })
      .where(eq(fbFeature.id, featureId));
    if (updateResult[0].affectedRows > 0) await enqueueFeedbackSync(tx, featureId);
    return updateResult;
  });
  if (result[0].affectedRows === 0) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }
  scheduleFeedbackSync();
  return NextResponse.json({ success: true, data: { id: String(featureId), status } });
}
