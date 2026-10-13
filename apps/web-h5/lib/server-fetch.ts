// oxlint-disable-next-line import/no-unassigned-import -- Server request monitoring must stay outside client bundles.
import 'server-only';
import { redactMonitorText } from '@go-tech/monitor-contract';
import { unstable_rethrow } from 'next/navigation';
import { captureServerError } from './browser-monitor/server';
import { isServerErrorReported, markServerErrorReported } from './browser-monitor/server-error-state';
import type { MonitorServerRequest } from './browser-monitor/server-report';

interface ServerFetchOptions {
  /** Enable only for APIs whose top-level code is a business response code. */
  inspectBusinessCode?: boolean;
  inspectJson?: boolean;
  request?: MonitorServerRequest;
}

class ServerRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly businessCode?: string | number
  ) {
    super(message);
    this.name = 'ServerRequestError';
  }
}

async function reportRequestFailure(
  error: unknown,
  details: { businessCode?: string | number; message: string; status?: number },
  options: ServerFetchOptions
) {
  if (isServerErrorReported(error)) return;
  // Never include upstream payloads, SDK error messages, credentials or request bodies.
  const failure = new ServerRequestError(redactMonitorText(details.message), details.status, details.businessCode);
  await captureServerError(failure, options.request);
  if (isServerErrorReported(failure)) markServerErrorReported(error);
}

async function inspectBusinessResponse(response: Response, address: string, options: ServerFetchOptions) {
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch (error) {
    await reportRequestFailure(
      error,
      { message: `${address} failed: invalid JSON response`, status: response.status },
      options
    );
    throw error;
  }
  const code = typeof body === 'object' && body !== null && 'code' in body ? body.code : undefined;
  if (
    options.inspectBusinessCode &&
    (typeof code === 'number' || typeof code === 'string') &&
    code !== 200 &&
    code !== '200'
  ) {
    await reportRequestFailure(
      response,
      {
        message: `${address} failed: business response code`,
        status: response.status,
        businessCode: code
      },
      options
    );
  }
}

/** Preserves native fetch responses, request options, Next caching and streaming bodies. */
export async function serverFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: ServerFetchOptions = {}
): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    unstable_rethrow(error);
    // User cancellation is control flow; an upstream timeout is a service failure.
    if (!(signal?.aborted && signal.reason?.name !== 'TimeoutError')) {
      await reportRequestFailure(error, { message: `${method} ${url} failed: network request failed` }, options);
    }
    throw error;
  }
  if (!response.ok) {
    await reportRequestFailure(
      response,
      { message: `${method} ${url} failed: HTTP ${response.status}`, status: response.status },
      options
    );
  } else if (
    options.inspectBusinessCode ||
    (options.inspectJson && response.headers.get('content-type')?.includes('application/json'))
  ) {
    await inspectBusinessResponse(response, `${method} ${url}`, options);
  }
  return response;
}

/** Platform APIs return JSON envelopes; response bodies remain available to the caller. */
export const serverPlatformFetch: typeof fetch = (input, init) =>
  serverFetch(input, init, { inspectBusinessCode: true });
