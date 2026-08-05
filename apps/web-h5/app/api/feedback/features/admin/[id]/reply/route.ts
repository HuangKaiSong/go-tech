import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbComment, fbFeature } from '@/db/scheam';
import { requireFeedbackAdmin } from '../../auth';
import { toIso } from '../../shared';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFeedbackAdmin(req);
  if (auth.response) return auth.response;

  const featureId = Number((await params).id);
  const body = (await req.json().catch(() => null)) as { content?: unknown; parentId?: unknown } | null;
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const parentId =
    body?.parentId === null || body?.parentId === undefined || body.parentId === '' ? null : Number(body.parentId);
  if (
    !Number.isSafeInteger(featureId) ||
    featureId <= 0 ||
    !content ||
    content.length > 1000 ||
    (parentId !== null && (!Number.isSafeInteger(parentId) || parentId <= 0))
  ) {
    return NextResponse.json({ success: false, message: '回覆內容或目標無效' }, { status: 400 });
  }

  const reply = await db.transaction(async tx => {
    const feature = await tx.query.fbFeature.findFirst({
      where: and(eq(fbFeature.id, featureId), isNull(fbFeature.deletedAt)),
      columns: { id: true }
    });
    if (!feature) return { error: 'feature' as const };

    if (parentId !== null) {
      const parent = await tx.query.fbComment.findFirst({
        where: and(
          eq(fbComment.id, parentId),
          eq(fbComment.featureId, featureId),
          eq(fbComment.isOfficial, false),
          isNull(fbComment.deletedAt)
        ),
        columns: { id: true }
      });
      if (!parent) return { error: 'parent' as const };
    }

    const parentCondition = parentId === null ? isNull(fbComment.parentId) : eq(fbComment.parentId, parentId);
    const existing = await tx.query.fbComment.findFirst({
      where: and(eq(fbComment.featureId, featureId), eq(fbComment.isOfficial, true), parentCondition),
      orderBy: [desc(fbComment.id)]
    });

    let id: number;
    let createdAt: Date;
    if (existing) {
      const restoresCount = Boolean(existing.deletedAt && existing.isVisible);
      await tx
        .update(fbComment)
        .set({
          authorId: auth.admin.id,
          content,
          deletedAt: null,
          deletedBy: null,
          isOfficial: true,
          isVisible: true
        })
        .where(eq(fbComment.id, existing.id));
      if (restoresCount) {
        await tx
          .update(fbFeature)
          .set({ commentCount: sql`${fbFeature.commentCount} + 1` })
          .where(eq(fbFeature.id, featureId));
      }
      id = existing.id;
      createdAt = existing.createdAt;
    } else {
      const [insertResult] = await tx.insert(fbComment).values({
        authorId: auth.admin.id,
        content,
        featureId,
        isOfficial: true,
        parentId
      });
      await tx
        .update(fbFeature)
        .set({ commentCount: sql`${fbFeature.commentCount} + 1` })
        .where(eq(fbFeature.id, featureId));
      id = insertResult.insertId;
      createdAt = new Date();
    }

    return { id, createdAt };
  });

  if ('error' in reply) {
    const message = reply.error === 'feature' ? '需求不存在或已移除' : '被回覆的評論不存在或已移除';
    return NextResponse.json({ success: false, message }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    data: {
      id: String(reply.id),
      author: 'GO-TECH Manager',
      content,
      isOfficial: true,
      createdAt: toIso(reply.createdAt),
      deletedAt: null
    }
  });
}
