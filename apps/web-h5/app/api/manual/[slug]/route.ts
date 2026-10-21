import { NextResponse } from 'next/server';
import { withRuntimeScope } from '@/db';
import { manualFailure, manualHeaders } from '@/lib/manual/api-response';
import { ManualError, readManualPublic } from '@/lib/manual/service';
/** 仅在当前可见的发布集合中查找 slug；未发布、下架或主题隐藏的指南统一返回 404。 */
export const GET = withRuntimeScope(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await params;
    const data = await readManualPublic();
    const article = data.articles.find(item => item.slug === slug);
    if (!article) throw new ManualError('找不到此指南', 404);
    return NextResponse.json({ code: 200, data: article }, { headers: manualHeaders });
  } catch (error) {
    return manualFailure(error);
  }
});
