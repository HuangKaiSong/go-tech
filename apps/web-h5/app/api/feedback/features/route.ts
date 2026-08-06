import { and, asc, desc, eq, isNull, like, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { enqueueFeedbackSync, scheduleFeedbackSync } from '@/app/api/feedback/sync';
import { db } from '@/db';
import { fbCategory, fbComment, fbFeature, fbSubCategory, fbVote } from '@/db/scheam';
import { getFeedbackUser } from '../auth';
import { moderateFeedbackContent } from '../moderation';
import { verifyBotToken } from '../turnstile';

const mapFeature = (row: any) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  author: row.author?.custName || 'Anonymous',
  category: row.category?.name || '',
  subCategory: row.subCategory?.name || undefined,
  likes: row.likeCount ?? 0,
  likedBy: (row.votes || []).map((v: any) => v.user?.custName).filter(Boolean) as string[],
  comments: (row.comments || [])
    .filter((c: any) => !c.parentId || (row.comments || []).some((parent: any) => parent.id === c.parentId))
    .map((c: any) => ({
      id: String(c.id),
      author: c.isOfficial ? 'GO-TECH Manager' : c.author?.custName || 'Anonymous',
      content: c.content,
      createdAt: new Date(c.createdAt),
      isOfficial: c.isOfficial,
      parentId: c.parentId ? String(c.parentId) : null
    })),
  status: row.status,
  createdAt: new Date(row.createdAt).toISOString(),
  shippedAt: row.shippedAt ? new Date(row.shippedAt).toISOString() : undefined,
  version: row.version || undefined
});

interface FeatureSubmission {
  categoryName: string;
  description: string;
  title: string;
  turnstileToken: string;
}

const validateFeatureSubmission = async ({ categoryName, description, title, turnstileToken }: FeatureSubmission) => {
  if (!title || title.length > 160 || !description || description.length > 500 || !categoryName) {
    return NextResponse.json({ success: false, message: '需求內容無效' }, { status: 400 });
  }

  const botVerification = await verifyBotToken(turnstileToken, 'feedback_post');
  if (!botVerification.success) {
    if (botVerification.reason === 'unavailable') {
      return NextResponse.json(
        { success: false, code: 'BOT_VERIFICATION_UNAVAILABLE', message: '機器人驗證服務連線失敗，請稍後重試' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, code: 'BOT_VERIFICATION_FAILED', message: '機器人驗證失敗，請重試' },
      { status: 400 }
    );
  }

  const response = await moderateFeedbackContent([title, description]);

  if (!response.allowed) {
    if ('error' in response) {
      return NextResponse.json(
        { success: false, code: 'CONTENT_MODERATION_FAILED', message: '內容審核服務暫時不可用，請稍後重試' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, code: 'CONTENT_REJECTED', message: '標題或內容未通過安全審核，請修改後重試' },
      { status: 422 }
    );
  }

  return null;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ success: true, data: [] });
  }

  const rows = await db.query.fbFeature.findMany({
    where: and(isNull(fbFeature.deletedAt), or(like(fbFeature.title, `%${q}%`), like(fbFeature.description, `%${q}%`))),
    with: {
      author: { columns: { custName: true } },
      category: { columns: { name: true } },
      subCategory: { columns: { name: true } },
      comments: {
        where: and(eq(fbComment.isVisible, true), isNull(fbComment.deletedAt)),
        with: { author: { columns: { custName: true } } },
        orderBy: [asc(fbComment.createdAt)]
      },
      votes: {
        with: { user: { columns: { custName: true } } }
      }
    },
    orderBy: [desc(fbFeature.createdAt)],
    limit: 50
  });

  return NextResponse.json({ success: true, data: rows.map(mapFeature) });
}

export async function POST(req: NextRequest) {
  const user = await getFeedbackUser();
  if (!user) {
    return NextResponse.json({ success: false, message: '請先登入後再操作' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    category?: unknown;
    description?: unknown;
    subCategory?: unknown;
    title?: unknown;
    turnstileToken?: unknown;
  } | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const categoryName = typeof body?.category === 'string' ? body.category.trim() : '';
  const subCategoryName = typeof body?.subCategory === 'string' ? body.subCategory.trim() : '';
  const turnstileToken = typeof body?.turnstileToken === 'string' ? body.turnstileToken : '';

  const validationResponse = await validateFeatureSubmission({ categoryName, description, title, turnstileToken });

  if (validationResponse) return validationResponse;

  const category = await db.query.fbCategory.findFirst({
    where: eq(fbCategory.name, categoryName),
    columns: { id: true, name: true }
  });
  if (!category) {
    return NextResponse.json({ success: false, message: '需求分類不存在' }, { status: 400 });
  }

  const subCategory = subCategoryName
    ? await db.query.fbSubCategory.findFirst({
        where: and(eq(fbSubCategory.categoryId, category.id), eq(fbSubCategory.name, subCategoryName)),
        columns: { id: true, name: true }
      })
    : null;
  if (subCategoryName && !subCategory) {
    return NextResponse.json({ success: false, message: '建議分類不存在' }, { status: 400 });
  }

  const feature = await db.transaction(async tx => {
    const [insertResult] = await tx.insert(fbFeature).values({
      authorId: user.id,
      categoryId: category.id,
      description,
      likeCount: 1,
      subCategoryId: subCategory?.id,
      title
    });
    const featureId = insertResult.insertId;
    await tx.insert(fbVote).values({ featureId, userId: user.id });
    await enqueueFeedbackSync(tx, featureId);

    return {
      author: user.custName,
      category: category.name,
      comments: [],
      createdAt: new Date().toISOString(),
      description,
      id: String(featureId),
      likedBy: [user.custName],
      likes: 1,
      status: 'pending' as const,
      subCategory: subCategory?.name,
      title
    };
  });

  scheduleFeedbackSync();
  return NextResponse.json({ success: true, data: feature }, { status: 201 });
}
