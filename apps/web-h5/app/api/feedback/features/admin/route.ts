import { type SQL, and, count, desc, eq, isNotNull, isNull, like, ne, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbFeature, platformCustomer } from '@/db/scheam';
import { requireFeedbackAdmin } from './auth';
import { getPagination, isFeatureStatus, toIso } from './shared';

const views = ['active', 'completed', 'trash'] as const;
type FeatureView = (typeof views)[number];

function isFeatureView(value: string): value is FeatureView {
  return views.includes(value as FeatureView);
}

export async function GET(req: NextRequest) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const viewValue = req.nextUrl.searchParams.get('view') || 'active';
  if (!isFeatureView(viewValue)) {
    return NextResponse.json({ success: false, message: '無效的列表範圍' }, { status: 400 });
  }

  const statusValue = req.nextUrl.searchParams.get('status');
  if (statusValue && !isFeatureStatus(statusValue)) {
    return NextResponse.json({ success: false, message: '無效的需求狀態' }, { status: 400 });
  }

  const { offset, page, pageSize } = getPagination(req);
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const conditions: SQL[] = [];

  if (viewValue === 'active') {
    conditions.push(isNull(fbFeature.deletedAt), ne(fbFeature.status, 'shipped'));
  } else if (viewValue === 'completed') {
    conditions.push(isNull(fbFeature.deletedAt), eq(fbFeature.status, 'shipped'));
  } else {
    conditions.push(isNotNull(fbFeature.deletedAt));
  }
  if (statusValue && isFeatureStatus(statusValue)) conditions.push(eq(fbFeature.status, statusValue));
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        like(fbFeature.title, search),
        like(fbFeature.description, search),
        like(platformCustomer.custName, search),
        like(platformCustomer.email, search)
      )!
    );
  }

  const where = and(...conditions);
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: fbFeature.id,
        title: fbFeature.title,
        description: fbFeature.description,
        author: platformCustomer.custName,
        email: platformCustomer.email,
        status: fbFeature.status,
        commentCount: fbFeature.commentCount,
        createdAt: fbFeature.createdAt,
        deletedAt: fbFeature.deletedAt
      })
      .from(fbFeature)
      .leftJoin(platformCustomer, eq(fbFeature.authorId, platformCustomer.id))
      .where(where)
      .orderBy(desc(fbFeature.createdAt), desc(fbFeature.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(fbFeature)
      .leftJoin(platformCustomer, eq(fbFeature.authorId, platformCustomer.id))
      .where(where)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: rows.map(row => ({
        ...row,
        id: String(row.id),
        author: row.author || 'Anonymous',
        email: row.email || '',
        createdAt: toIso(row.createdAt),
        deletedAt: toIso(row.deletedAt)
      })),
      page,
      pageSize,
      total: totalRows[0]?.total ?? 0
    }
  });
}
