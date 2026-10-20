import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPageBlocks } from '@/app/lib/pageBlocks';
import { captureServerRouteError } from '@/lib/browser-monitor/server';
import { GET, POST } from './route';

vi.mock('@/lib/browser-monitor/server', () => ({ captureServerRouteError: vi.fn() }));
vi.mock('next/server', async importOriginal => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn(async () => {})
}));

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'h5-block-api-'));
  vi.stubEnv('H5_PAGE_BLOCKS_DIR', directory);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  await rm(directory, { recursive: true, force: true });
});

const saveRequest = (payload: unknown) =>
  new Request('http://localhost/api/page-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

describe('persistent page block API', () => {
  it('serves the saved content to both the API and page renderer immediately', async () => {
    const blocks = [{ id: 'home-section', type: 'section', title: 'Updated title' }];
    const response = await POST(saveRequest({ page: 'home', blocks }));
    expect(response.status).toBe(200);
    const result = await response.json();
    const read = await GET(new Request(`http://localhost${result.path}`));
    expect(read.headers.get('Cache-Control')).toBe('no-store');
    expect((await read.json()).data.pages.home).toEqual(blocks);
    expect(await loadPageBlocks('home', [])).toEqual(blocks);

    const updated = [{ ...blocks[0], title: 'Saved again' }];
    await POST(saveRequest({ page: 'home', blocks: updated }));
    expect(await loadPageBlocks('home', [])).toEqual(updated);
  });

  it('rejects invalid keys and payloads before writing', async () => {
    expect((await POST(saveRequest({ page: '../escape', blocks: [] }))).status).toBe(400);
    expect((await POST(saveRequest({ page: 'home', blocks: {} }))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/page-blocks?page=../escape'))).status).toBe(400);
  });

  it('distinguishes absent pages from corrupt configuration', async () => {
    expect((await GET(new Request('http://localhost/api/page-blocks?page=missing-page'))).status).toBe(404);
    await writeFile(path.join(directory, 'broken-page.json'), '{');
    expect((await GET(new Request('http://localhost/api/page-blocks?page=broken-page'))).status).toBe(500);
    expect(captureServerRouteError).toHaveBeenCalledOnce();
  });
});
