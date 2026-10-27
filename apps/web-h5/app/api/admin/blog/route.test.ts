/** 验证管理员认证先于解析/读取，并限制提交大小及错误信息的公开范围。 */
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { mutateBlog, readBlogAdmin } from '@/lib/blog/service';
import { GET, POST } from './route';
vi.mock('@/app/api/feedback/features/admin/auth', () => ({ requireFeedbackAdmin: vi.fn() }));
vi.mock('@/db', () => ({ withRuntimeScope: (handler: unknown) => handler }));
vi.mock('@/lib/blog/service', async () => ({
  ...(await import('@/lib/blog/error')),
  mutateBlog: vi.fn(),
  readBlogAdmin: vi.fn()
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const request = (body = '{}') => new NextRequest('http://localhost/api/admin/blog', { method: 'POST', body });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireFeedbackAdmin).mockResolvedValue({ admin: { id: 12 } });
  vi.mocked(readBlogAdmin).mockResolvedValue({ categories: [], articles: [], settings: [] });
});
describe('blog administrator boundary', () => {
  it('requires administrator authentication before loading drafts or parsing JSON', async () => {
    vi.mocked(requireFeedbackAdmin).mockResolvedValue({ response: NextResponse.json({}, { status: 401 }) });
    expect((await GET(request())).status).toBe(401);
    expect((await POST(request('{'))).status).toBe(401);
    expect(readBlogAdmin).not.toHaveBeenCalled();
    expect(mutateBlog).not.toHaveBeenCalled();
  });
  it('rejects malformed and oversized submissions without mutating', async () => {
    expect((await POST(request('{'))).status).toBe(400);
    expect((await POST(request('x'.repeat(1_000_001)))).status).toBe(413);
    expect(mutateBlog).not.toHaveBeenCalled();
  });
  it('uses the authenticated administrator identity and disables response caching', async () => {
    const response = await POST(request(JSON.stringify({ kind: 'category', action: 'publish', id: 1, version: 2 })));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mutateBlog).toHaveBeenCalledWith({ kind: 'category', action: 'publish', id: 1, version: 2 }, 12);
  });
  it('does not disclose database errors or submitted content', async () => {
    vi.mocked(readBlogAdmin).mockRejectedValue(new Error('SQL password=secret draft=private'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('secret');
  });
});
