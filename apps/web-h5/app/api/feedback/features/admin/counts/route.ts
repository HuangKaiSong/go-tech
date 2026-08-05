import { and, count, eq, isNotNull, isNull } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbComment, fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../auth';

export async function GET(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const [completedRows, deletedFeatureRows, deletedCommentRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(fbFeature)
      .where(and(eq(fbFeature.status, 'shipped'), isNull(fbFeature.deletedAt))),
    db.select({ value: count() }).from(fbFeature).where(isNotNull(fbFeature.deletedAt)),
    db.select({ value: count() }).from(fbComment).where(isNotNull(fbComment.deletedAt))
  ]);

  const deletedFeatures = deletedFeatureRows[0]?.value ?? 0;
  const deletedComments = deletedCommentRows[0]?.value ?? 0;
  return NextResponse.json({
    success: true,
    data: {
      completed: completedRows[0]?.value ?? 0,
      trash: deletedFeatures + deletedComments,
      deletedFeatures,
      deletedComments
    }
  });
}
