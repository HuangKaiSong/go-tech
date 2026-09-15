'use client';

import { classifyResponse } from './classify-response';
import { ClientHttpError } from './client-http-error';
import { publishClientHttpError } from './error-events';

export interface ClientFetchOptions {
  feedback?: 'auto' | 'silent';
}

function isAbortError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function rejectRequest(error: ClientHttpError, feedback: ClientFetchOptions['feedback']): never {
  if (feedback !== 'silent') publishClientHttpError(error);
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
    if (isAbortError(cause)) throw cause;
    return rejectRequest(new ClientHttpError({ cause, kind: 'network' }), options.feedback);
  }

  const classification = await classifyResponse(response);
  if (classification.ok) return response;

  return rejectRequest(
    new ClientHttpError({
      businessCode: classification.businessCode,
      kind: classification.kind,
      response,
      status: classification.status,
      userMessage: classification.userMessage
    }),
    options.feedback
  );
}
