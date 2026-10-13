import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureServerError } from './browser-monitor/server';
import { isServerErrorReported, markServerErrorReported } from './browser-monitor/server-error-state';
import { serverFetch, serverPlatformFetch } from './server-fetch';

vi.mock('server-only', () => ({}));
vi.mock('./browser-monitor/server', () => ({
  captureServerError: vi.fn(async (error: unknown) => markServerErrorReported(error))
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('server request monitoring', () => {
  it('keeps HTTP responses readable and reports the original endpoint and status without credentials', async () => {
    const response = new Response('private upstream body', { status: 503 });
    const transport = vi.fn(async () => response);
    vi.stubGlobal('fetch', transport);
    const url = 'https://user:secret@api.example.com/orders?token=private';
    const init = { headers: { Authorization: 'Bearer hidden' }, method: 'POST', cache: 'no-store' } as const;
    const context = { headers: new Headers(), path: '/api/order', method: 'POST', routeType: 'route' } as const;
    expect(await serverFetch(url, init, { request: context })).toBe(response);
    expect(transport).toHaveBeenCalledWith(url, init);
    expect(await response.text()).toBe('private upstream body');
    expect(captureServerError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'POST https://api.example.com/orders failed: HTTP 503', status: 503 }),
      context
    );
  });

  it('reports a network failure, rethrows the original error and recognizes later wrapped errors', async () => {
    const failure = new TypeError('private upstream credentials');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw failure;
      })
    );
    await expect(serverFetch(new Request('https://api.example.com/orders', { method: 'DELETE' }))).rejects.toBe(
      failure
    );
    expect(captureServerError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'DELETE https://api.example.com/orders failed: network request failed' }),
      undefined
    );
    expect(isServerErrorReported(new Error('outer', { cause: failure }))).toBe(true);
  });

  it('ignores custom abort reasons but reports upstream timeouts', async () => {
    const controller = new AbortController();
    const reason = new Error('cancelled by user');
    controller.abort(reason);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw reason;
      })
    );
    await expect(serverFetch('https://api.example.com', { signal: controller.signal })).rejects.toBe(reason);
    expect(captureServerError).not.toHaveBeenCalled();
    const timeout = new DOMException('deadline reached', 'TimeoutError');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw timeout;
      })
    );
    await expect(serverFetch('https://api.example.com', { signal: AbortSignal.abort(timeout) })).rejects.toBe(timeout);
    expect(captureServerError).toHaveBeenCalledOnce();
  });

  it('checks only top-level business codes and accepts both success representations', async () => {
    for (const body of [{ code: 200 }, { code: '200' }, { data: { code: 500 } }]) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => Response.json(body))
      );
      // oxlint-disable-next-line no-await-in-loop -- Verify each independent response stays readable.
      expect(await (await serverPlatformFetch('https://api.example.com/orders')).json()).toEqual(body);
    }
    expect(captureServerError).not.toHaveBeenCalled();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 403, message: 'private response payload' }))
    );
    const response = await serverPlatformFetch('https://api.example.com/orders');
    expect(await response.json()).toEqual({ code: 403, message: 'private response payload' });
    expect(captureServerError).toHaveBeenCalledWith(
      expect.objectContaining({
        businessCode: 403,
        status: 200,
        message: 'GET https://api.example.com/orders failed: business response code'
      }),
      undefined
    );
  });

  it('reports malformed platform JSON with its endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('private malformed body'))
    );
    await expect(serverPlatformFetch('https://api.example.com/orders')).rejects.toBeInstanceOf(SyntaxError);
    expect(captureServerError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'GET https://api.example.com/orders failed: invalid JSON response' }),
      undefined
    );
  });

  it('returns streaming responses immediately without consuming or cloning them', async () => {
    const response = new Response(new ReadableStream(), { headers: { 'Content-Type': 'text/event-stream' } });
    const clone = vi.spyOn(response, 'clone');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response)
    );
    expect(await serverFetch('https://ai.example.com/chat', {}, { inspectJson: true })).toBe(response);
    expect(response.bodyUsed).toBe(false);
    expect(clone).not.toHaveBeenCalled();
    expect(captureServerError).not.toHaveBeenCalled();
    await response.body?.cancel();
  });
});
