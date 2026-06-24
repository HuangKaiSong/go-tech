import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

type Payload = {
  blocks: unknown[];
  page: string;
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  if (!page) {
    return NextResponse.json({ ok: false, error: 'Missing page parameter' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'page-blocks', `${page}.json`);
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({
      code: 200,
      message: '獲取成功',
      data: JSON.parse(content)
    });
  } catch {
    return NextResponse.json(null, { status: 404 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as Payload;
    if (!body?.page || !Array.isArray(body.blocks)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'page-blocks');
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${body.page}.json`);
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      pages: {
        [body.page]: body.blocks
      }
    };
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, path: `/page-blocks/${body.page}.json` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'Failed to save file' }, { status: 500 });
  }
};
