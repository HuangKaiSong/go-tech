import assert from 'node:assert/strict';
import { test } from 'node:test';
import { savePageBlocks } from './page-block-api';

test('editor confirms persistence and rejects HTTP, business, invalid JSON and network failures', async context => {
  const blocks = [{ id: 'home-section', title: 'New title' }];
  const request = context.mock.method(globalThis, 'fetch', async (_url: unknown, _init?: RequestInit) =>
    Response.json({ ok: true })
  );
  await savePageBlocks('home', blocks);
  assert.equal(request.mock.calls[0]?.arguments[0], '/h5-hook/api/page-blocks');
  assert.deepEqual(JSON.parse(String(request.mock.calls[0]?.arguments[1]?.body)), { page: 'home', blocks });

  request.mock.mockImplementation(async () => Response.json({ ok: false }, { status: 500 }));
  await assert.rejects(savePageBlocks('home', blocks), /Save request failed/);
  request.mock.mockImplementation(async () => Response.json({ ok: false }));
  await assert.rejects(savePageBlocks('home', blocks), /Save was not confirmed/);
  request.mock.mockImplementation(async () => new Response('<html>Login</html>'));
  await assert.rejects(savePageBlocks('home', blocks), SyntaxError);
  request.mock.mockImplementation(async () => {
    throw new TypeError('Offline');
  });
  await assert.rejects(savePageBlocks('home', blocks), /Offline/);
});
