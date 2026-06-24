import type { HttpBaseResponse } from '@go-tech/core-types';
import { HttpError } from './types';
import type { HttpAdapter, RequestOptions } from './types';

const normalizeBaseUrl = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

const resolveHeaders = async (
  source: HttpAdapter['defaultHeaders']
): Promise<Record<string, string> | undefined> => {
  if (typeof source === 'function') {
    return source();
  }
  return source;
};

/**
 * Runtime-agnostic HTTP client built on the global `fetch`. All
 * platform-specific behavior (base URL, auth token, error handling) is
 * supplied through an injected {@link HttpAdapter}, so the same kernel runs
 * under Next.js (server) and Vite (browser).
 */
export class HttpClient {
  private readonly adapter: HttpAdapter;

  constructor(adapter: HttpAdapter) {
    this.adapter = adapter;
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers: optionHeaders, params, ...rest } = options;

    let fullEndpoint = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      fullEndpoint = `${endpoint}?${queryString}`;
    }

    const baseUrl = normalizeBaseUrl(await this.adapter.getBaseUrl());
    const url = `${baseUrl}${fullEndpoint}`;

    const headers = new Headers(await resolveHeaders(this.adapter.defaultHeaders));
    new Headers(optionHeaders).forEach((value, key) => headers.set(key, value));

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = await this.adapter.getToken?.();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...rest,
        headers,
        body: body === undefined ? null : JSON.stringify(body)
      });
    } catch (cause) {
      const error = new HttpError('Network request failed', { cause });
      await this.adapter.onError?.(error);
      throw error;
    }

    if (response.status === 401) {
      await this.adapter.onUnauthorized?.();
    }

    if (!response.ok && !this.adapter.returnErrorBody) {
      const payload = await response.clone().json().catch(() => undefined);
      const error = new HttpError(`Request failed with status ${response.status}`, {
        status: response.status,
        payload
      });
      await this.adapter.onError?.(error);
      throw error;
    }

    return (await response.json()) as T;
  }

  get<T = any>(endpoint: string, params?: Record<string, string>): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, { method: 'GET', params });
  }

  post<T = any>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string>
  ): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, { method: 'POST', body: data, params });
  }

  put<T = any>(endpoint: string, data?: unknown): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, { method: 'PUT', body: data });
  }

  delete<T = any>(endpoint: string): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, { method: 'DELETE' });
  }
}
