import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpClient, HttpError } from '../src/index';

test('adapters without an injected transport still use runtime fetch and reject HTTP errors', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'unavailable' }, { status: 503 }));
  const client = new HttpClient({ getBaseUrl: () => 'https://api.example.com' });
  await assert.rejects(client.get('/orders'), error => error instanceof HttpError && error.status === 503);
});

test('application transport receives authenticated requests and preserves legacy error response bodies', async () => {
  let calls = 0;
  const client = new HttpClient({
    fetch: async (input, init) => {
      calls += 1;
      assert.equal(String(input), 'https://api.example.com/orders?limit=10');
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-token');
      assert.equal(init?.method, 'GET');
      return Response.json({ code: 503, data: null }, { status: 503 });
    },
    getBaseUrl: () => 'https://api.example.com/',
    getToken: () => 'test-token',
    returnErrorBody: true
  });
  assert.deepEqual(await client.get('/orders', { limit: '10' }), { code: 503, data: null });
  assert.equal(calls, 1);
});

test('injected network failures retain their cause and invoke the adapter error handler', async () => {
  const cause = new Error('offline');
  let observed: HttpError | undefined;
  const client = new HttpClient({
    fetch: async () => {
      throw cause;
    },
    getBaseUrl: () => 'https://api.example.com',
    onError: error => {
      observed = error;
    }
  });
  await assert.rejects(client.get('/orders'), error => error instanceof HttpError && error.cause === cause);
  assert.equal(observed?.cause, cause);
});
