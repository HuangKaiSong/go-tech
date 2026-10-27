import { type NextRequest, NextResponse } from 'next/server';
import { withRuntimeScope } from '@/db';
import { blogFailure, blogHeaders } from '@/lib/blog/api-response';
import { readBlogList } from '@/lib/blog/public';
export const GET = withRuntimeScope(async (request: NextRequest) => {
  try {
    const query = request.nextUrl.searchParams;
    const data = await readBlogList({
      categoryId: query.get('categoryId') ?? undefined,
      q: query.get('q') ?? '',
      page: query.get('page') ?? 1
    });
    return NextResponse.json({ code: 200, data }, { headers: blogHeaders });
  } catch (error) {
    return blogFailure(error);
  }
});
