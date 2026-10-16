import assert from 'node:assert/strict';
import { test } from 'node:test';
import { queryMonitorAdmin } from './admin-query';

const id = '11111111-1111-4111-8111-111111111111';
const allowed = async () => undefined;
const config = { serviceUrl: 'http://localhost:8200', queryToken: 'private-query-test', authorize: allowed };

test('unauthenticated admin requests never contact monitor storage', async () => {
  let forwarded = false;
  const response = await queryMonitorAdmin(new Request('http://h5/api/browser-monitor/admin'), [], {
    ...config,
    authorize: async () => Response.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    forward: async () => {
      forwarded = true;
      return Response.json({});
    }
  });
  assert.equal(response.status, 401);
  assert.equal(forwarded, false);
});

test('admin list query forwards only supported filters using a server-only token', async () => {
  const result = { code: 200, data: { items: [], nextCursor: null } };
  const response = await queryMonitorAdmin(
    new Request('http://h5/api/browser-monitor/admin?kind=error&limit=20&from=1000&to=2000&secret=private'),
    [],
    {
      ...config,
      forward: async (input, init) => {
        assert.equal(String(input), 'http://localhost:8200/api/reports?kind=error&limit=20&from=1000&to=2000');
        assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer private-query-test');
        return Response.json(result);
      }
    }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), result);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('invalid IDs, missing query config and upstream errors are handled without leaking credentials', async () => {
  const request = new Request('http://h5/api/browser-monitor/admin');
  assert.equal((await queryMonitorAdmin(request, ['../private'], config)).status, 400);
  assert.equal((await queryMonitorAdmin(request, [id, 'unknown'], config)).status, 400);
  assert.equal((await queryMonitorAdmin(request, [], { authorize: allowed })).status, 503);
  const response = await queryMonitorAdmin(request, [id], {
    ...config,
    forward: async () => Response.json({ message: 'private-query-test' }, { status: 401 })
  });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('private-query-test'), false);
});

test('raw replay arrays can be queried after admin authentication', async () => {
  const events = [{ type: 2, timestamp: 100, data: {} }];
  const response = await queryMonitorAdmin(new Request('http://h5/api/browser-monitor/admin'), [id, 'replay'], {
    ...config,
    forward: async input => {
      assert.equal(String(input), `http://localhost:8200/api/reports/${id}/replay`);
      return Response.json(events);
    }
  });
  assert.deepEqual(await response.json(), events);
});
