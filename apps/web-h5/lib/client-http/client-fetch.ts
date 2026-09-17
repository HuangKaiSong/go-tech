'use client';

import { runAuthResponseMiddleware } from './auth-response-middleware';
import { classifyResponse } from './classify-response';
import { ClientHttpError } from './client-http-error';
import { publishClientHttpError } from './error-events';

export interface ClientFetchOptions {
  feedback?: 'auto' | 'silent';
  /** 复用调用点已有反馈（例如 loading toast）的 id。 */
  feedbackId?: number | string;
}

function isAbortError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function isRequestAborted(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.signal?.aborted) return true;
  return typeof Request !== 'undefined' && input instanceof Request && input.signal.aborted;
}

function rejectRequest(error: ClientHttpError, options: ClientFetchOptions): never {
  if (options.feedback !== 'silent') publishClientHttpError(error, options.feedbackId);
  throw error;
}

/** 浏览器 fetch 统一入口；自动识别请求错误并发布结构化反馈事件。 */
export async function clientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: ClientFetchOptions = {}
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (cause) {
    if (isAbortError(cause) || isRequestAborted(input, init)) throw cause;
    return rejectRequest(new ClientHttpError({ cause, kind: 'network' }), options);
  }

  const classification = await classifyResponse(response);
  runAuthResponseMiddleware(response, classification);
  if (classification.ok) return response;

  return rejectRequest(
    new ClientHttpError({
      businessCode: classification.businessCode,
      kind: classification.kind,
      response,
      status: classification.status,
      userMessage: classification.userMessage
    }),
    options
  );
}
