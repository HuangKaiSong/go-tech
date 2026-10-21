import { NextResponse } from 'next/server';
import { withRuntimeScope } from '@/db';
import { publicSnapshot } from '@/lib/runtime-config/server';
export const runtime = 'nodejs';
export const GET = withRuntimeScope(async () => {
  try {
    return NextResponse.json({ code: 200, data: await publicSnapshot() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ code: 503, message: '配置暂时不可用' }, { status: 503 });
  }
});
