import { type SQL, and, count, desc, eq, isNotNull, like, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbComment, fbFeature, platformCustomer } from '@/db/scheam';
import { requireFeedbackAdmin } from '../auth';
import { getPagination, isFeatureStatus, toIso } from '../shared';

export async function GET(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const scope = req.nextUrl.searchParams.get('scope') || 'trash';
  if (scope !== 'all' && scope !== 'trash') {
    return NextResponse.json({ success: false, message: '無效的評論範圍' }, { status: 400 });
  }
  const statusValue = req.nextUrl.searchParams.get('status');
  if (statusValue && !isFeatureStatus(statusValue)) {
    return NextResponse.json({ success: false, message: '無效的需求狀態' }, { status: 400 });
  }

  const { offset, page, pageSize } = getPagination(req);
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const conditions: SQL[] = [];
  if (scope === 'trash') conditions.push(isNotNull(fbComment.deletedAt));
  if (statusValue && isFeatureStatus(statusValue)) conditions.push(eq(fbFeature.status, statusValue));
  if (q) {
    const search = `%${q}%`;
    const matchesOfficialName = 'go-tech manager'.includes(q.toLocaleLowerCase());
    conditions.push(
      or(
        like(fbFeature.title, search),
        like(fbComment.content, search),
        like(platformCustomer.custName, search),
        like(platformCustomer.email, search),
        matchesOfficialName ? eq(fbComment.isOfficial, true) : undefined
      )!
    );
  }
  const where = and(...conditions);

  const baseSelection = {
    id: fbComment.id,
    featureId: fbComment.featureId,
    featureTitle: fbFeature.title,
    parentId: fbComment.parentId,
    customerName: platformCustomer.custName,
    content: fbComment.content,
    isOfficial: fbComment.isOfficial,
    createdAt: fbComment.createdAt,
    deletedAt: fbComment.deletedAt
  };
  const [rows, totalRows] = await Promise.all([
    db
      .select(baseSelection)
      .from(fbComment)
      .innerJoin(fbFeature, eq(fbComment.featureId, fbFeature.id))
      .leftJoin(platformCustomer, and(eq(fbComment.authorId, platformCustomer.id), eq(fbComment.isOfficial, false)))
      .where(where)
      .orderBy(desc(fbComment.deletedAt), desc(fbComment.createdAt), desc(fbComment.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(fbComment)
      .innerJoin(fbFeature, eq(fbComment.featureId, fbFeature.id))
      .leftJoin(platformCustomer, and(eq(fbComment.authorId, platformCustomer.id), eq(fbComment.isOfficial, false)))
      .where(where)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: rows.map(row => ({
        id: String(row.id),
        featureId: String(row.featureId),
        featureTitle: row.featureTitle,
        parentId: row.parentId ? String(row.parentId) : null,
        author: row.isOfficial ? 'GO-TECH Manager' : row.customerName || 'Anonymous',
        content: row.content,
        isOfficial: row.isOfficial,
        createdAt: toIso(row.createdAt),
        deletedAt: toIso(row.deletedAt)
      })),
      page,
      pageSize,
      total: totalRows[0]?.total ?? 0
    }
  });
}
