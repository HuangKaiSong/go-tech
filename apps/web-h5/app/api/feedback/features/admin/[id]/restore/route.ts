import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../../auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const featureId = Number((await params).id);
  if (!Number.isSafeInteger(featureId) || featureId <= 0) {
    return NextResponse.json({ success: false, message: '無效的需求 ID' }, { status: 400 });
  }
  const result = await db.update(fbFeature).set({ deletedAt: null }).where(eq(fbFeature.id, featureId));
  if (result[0].affectedRows === 0) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { id: String(featureId), deleted: false } });
}
