import { asc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbComment, fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../../auth';
import { toIso } from '../../shared';

interface DetailComment {
  content: string;
  createdAt: Date;
  deletedAt: Date | null;
  id: number;
}

const mapOfficialReply = (row: DetailComment | undefined) =>
  row
    ? {
        id: String(row.id),
        author: 'GO-TECH Manager',
        content: row.content,
        isOfficial: true,
        createdAt: toIso(row.createdAt),
        deletedAt: toIso(row.deletedAt)
      }
    : null;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const featureId = Number((await params).id);
  if (!Number.isSafeInteger(featureId) || featureId <= 0) {
    return NextResponse.json({ success: false, message: '無效的需求 ID' }, { status: 400 });
  }

  const feature = await db.query.fbFeature.findFirst({
    where: eq(fbFeature.id, featureId),
    columns: { id: true }
  });
  if (!feature) return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });

  const rows = await db.query.fbComment.findMany({
    where: eq(fbComment.featureId, featureId),
    with: { author: { columns: { custName: true } } },
    orderBy: [asc(fbComment.createdAt), asc(fbComment.id)]
  });

  const officialByParent = new Map<number, (typeof rows)[number]>();
  let featureReply: (typeof rows)[number] | undefined;
  for (const row of rows) {
    if (row.isOfficial) {
      if (row.parentId) officialByParent.set(row.parentId, row);
      else featureReply = row;
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      featureReply: mapOfficialReply(featureReply),
      comments: rows
        .filter(row => !row.isOfficial)
        .map(row => ({
          id: String(row.id),
          author: row.author?.custName || 'Anonymous',
          content: row.content,
          isVisible: row.isVisible,
          createdAt: toIso(row.createdAt),
          deletedAt: toIso(row.deletedAt),
          reply: mapOfficialReply(officialByParent.get(row.id))
        }))
    }
  });
}
