import { redirectBrowserToLogin } from '../auth/auth-redirect';
import type { ResponseClassification } from './classify-response';

function isUnauthorizedBusinessCode(code: number | string | undefined) {
  return code !== undefined && String(code) === '401';
}

/** ClientFetch 的登录态响应中间件，同时识别 HTTP 401 与平台业务码 401。 */
export function runAuthResponseMiddleware(response: Response, classification: ResponseClassification) {
  if (response.status === 401 || (!classification.ok && isUnauthorizedBusinessCode(classification.businessCode))) {
    redirectBrowserToLogin();
  }
}
