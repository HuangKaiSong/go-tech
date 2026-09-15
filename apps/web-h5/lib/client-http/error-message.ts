import type { ClientHttpErrorEvent } from './error-events';

export type ClientHttpErrorMessageKey =
  | 'badRequest'
  | 'business'
  | 'forbidden'
  | 'network'
  | 'notFound'
  | 'requestFailed'
  | 'serverError'
  | 'serviceUnavailable'
  | 'timeout'
  | 'tooManyRequests'
  | 'unauthorized';

/** 将结构化错误映射到本地翻译 key，具体文案由客户端通知组件决定。 */
export function getClientHttpErrorMessageKey(event: ClientHttpErrorEvent): ClientHttpErrorMessageKey {
  if (event.kind === 'network') return 'network';
  if (event.kind === 'business') return 'business';

  switch (event.status) {
    case 400:
      return 'badRequest';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 408:
    case 504:
      return 'timeout';
    case 429:
      return 'tooManyRequests';
    case 500:
      return 'serverError';
    case 502:
    case 503:
      return 'serviceUnavailable';
    default:
      return 'requestFailed';
  }
}
