import type { BusinessCode, ClientHttpError, ClientHttpErrorKind } from './client-http-error';

export interface ClientHttpErrorEvent {
  businessCode?: BusinessCode;
  id: number | string;
  kind: ClientHttpErrorKind;
  status?: number;
  userMessage?: string;
}

type ClientHttpErrorListener = (event: ClientHttpErrorEvent) => void;

const listeners = new Set<ClientHttpErrorListener>();
let eventSequence = 0;

export function subscribeClientHttpErrors(listener: ClientHttpErrorListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 发布经过白名单筛选的错误字段，避免响应 payload、请求头或 token 进入 UI 事件。 */
export function publishClientHttpError(error: ClientHttpError, feedbackId?: number | string) {
  error.markNotified();
  eventSequence += 1;

  const event: ClientHttpErrorEvent = {
    id: feedbackId ?? `client-http-${Date.now()}-${eventSequence}`,
    kind: error.kind
  };

  if (error.businessCode !== undefined) event.businessCode = error.businessCode;
  if (error.status !== undefined) event.status = error.status;
  if (error.userMessage !== undefined) event.userMessage = error.userMessage;

  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // UI 监听器失败不能覆盖原始请求错误。
    }
  }
}
