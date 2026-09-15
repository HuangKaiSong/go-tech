'use client';

import { sendToBetterStack } from '@/lib/betterstack-logger';
import { ClientHttpError } from '@/lib/client-http/client-http-error';

/** 保留既有客户端错误上报，但只记录请求元数据，不上传表单和响应 payload。 */
export function reportClientHttpError(error: unknown, uri: string) {
  if (!(error instanceof ClientHttpError)) return;

  sendToBetterStack('error', error.response?.statusText || error.message, {
    businessCode: error.businessCode,
    kind: error.kind,
    status: error.status,
    uri
  });
}
