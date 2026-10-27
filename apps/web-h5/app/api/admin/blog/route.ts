import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { withRuntimeScope } from '@/db';
import { blogFailure, blogHeaders } from '@/lib/blog/api-response';
import { BlogError, mutateBlog, readBlogAdmin } from '@/lib/blog/service';
export const runtime = 'nodejs';
export const GET = withRuntimeScope(async (request: NextRequest) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    return NextResponse.json({ code: 200, data: await readBlogAdmin() }, { headers: blogHeaders });
  } catch (error) {
    return blogFailure(error);
  }
});
export const POST = withRuntimeScope(async (request: NextRequest) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    if (Number(request.headers.get('content-length')) > 1_000_000) throw new BlogError('提交內容過大', 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 1_000_000) throw new BlogError('提交內容過大', 413);
    const savedId = await mutateBlog(JSON.parse(text), auth.admin.id);
    revalidatePath('/[locale]/blog', 'layout');
    return NextResponse.json({ code: 200, savedId, data: await readBlogAdmin() }, { headers: blogHeaders });
  } catch (error) {
    return blogFailure(error);
  }
});
