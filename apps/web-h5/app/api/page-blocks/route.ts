import { NextResponse } from 'next/server';
import { captureServerRouteError } from '@/lib/browser-monitor/server';
import { isValidPageBlockKey, readPageBlockFile, writePageBlockFile } from '@/lib/page-block-storage';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  if (!isValidPageBlockKey(page)) {
    return NextResponse.json({ ok: false, error: 'Invalid page parameter' }, { status: 400 });
  }

  try {
    return NextResponse.json(
      {
        code: 200,
        message: '獲取成功',
        data: await readPageBlockFile(page)
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json(null, { status: 404 });
    }
    await captureServerRouteError(error, request);
    return NextResponse.json({ ok: false, error: 'Failed to read file' }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== 'object' ||
      !('page' in body) ||
      !('blocks' in body) ||
      !isValidPageBlockKey(body.page) ||
      !Array.isArray(body.blocks)
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    await writePageBlockFile(body.page, body.blocks);

    return NextResponse.json({ ok: true, path: `/api/page-blocks?page=${body.page}` });
  } catch (error) {
    await captureServerRouteError(error, request);
    console.error(error);
    return NextResponse.json({ ok: false, error: 'Failed to save file' }, { status: 500 });
  }
};
