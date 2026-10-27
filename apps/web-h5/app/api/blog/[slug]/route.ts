import { NextResponse } from 'next/server';
import { withRuntimeScope } from '@/db';
import { blogFailure, blogHeaders } from '@/lib/blog/api-response';
import { readBlogDetail } from '@/lib/blog/public';
export const GET = withRuntimeScope(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    return NextResponse.json({ code: 200, data: await readBlogDetail((await params).slug) }, { headers: blogHeaders });
  } catch (error) {
    return blogFailure(error);
  }
});
