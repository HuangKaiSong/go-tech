import { and, eq, isNull } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { enqueueFeedbackSync, scheduleFeedbackSync } from '@/app/api/feedback/sync';
import { getDb, withRuntimeScope } from '@/db';
import { fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../auth';

async function handleDELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const featureId = Number((await params).id);
  if (!Number.isSafeInteger(featureId) || featureId <= 0) {
    return NextResponse.json({ success: false, message: '無效的需求 ID' }, { status: 400 });
  }

  const existing = await (
    await getDb()
  ).transaction(async tx => {
    const feature = await tx.query.fbFeature.findFirst({
      where: eq(fbFeature.id, featureId),
      columns: { id: true, deletedAt: true }
    });
    if (!feature) return null;
    if (!feature.deletedAt) {
      await tx
        .update(fbFeature)
        .set({ deletedAt: new Date() })
        .where(and(eq(fbFeature.id, featureId), isNull(fbFeature.deletedAt)));
    }
    await enqueueFeedbackSync(tx, featureId);
    return feature;
  });
  if (!existing) return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  scheduleFeedbackSync(req);
  return NextResponse.json({ success: true, data: { id: String(featureId), deleted: true } });
}

export const DELETE = withRuntimeScope(handleDELETE);
