
/**
 * 携带已翻译 message 的 HTTP 错误。
 * 服务端 error.message 始终为中文，httpFetch 在非 2xx 时自动翻译后抛出。
 */
export class HttpError extends Error {
  /** HTTP 状态码 */
  readonly status: number;
  /** 解析后的响应体（非 JSON 时为 null） */
  readonly data: unknown;
  /** 原始 Response（body 未被消费，仍可读取） */
  readonly response: Response;

  constructor(
    message: string,
    init: { status: number; data: unknown; response: Response }
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = init.status;
    this.data = init.data;
    this.response = init.response;
  }
}

/** 从 cookie 读取当前语言（GO_TECH_LANGUAGE 非 httpOnly，客户端可读） */
function getClientLocale(): string {
  if (typeof document === 'undefined') return 'zh-hk';
  const match = document.cookie.match(/(?:^|;\s*)GO_TECH_LANGUAGE=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : 'zh-hk';
}

/**
 * fetch 封装：签名与原生 fetch 一致。
 * - 2xx：原样返回 Response
 * - 非 2xx：解析 body 中的 message，翻译为当前语言后抛出 HttpError
 *
 * @example
 *   try {
 *     const res = await httpFetch('/api/xxx', { method: 'POST', body: ... });
 *   } catch (error) {
 *     if (error instanceof HttpError) {
 *       toast.error(error.message || t('failed'));
 *     }
 *   }
 */
export async function httpFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) return response;

  // clone 后解析，保留原始 body 供 response 继续使用
  let data: unknown = null;
  try {
    data = await response.clone().json();
  } catch {
    // 非 JSON 响应体，忽略
  }

  const rawMessage =
    data &&
    typeof (data as Record<string, unknown>).message === 'string'
      ? ((data as Record<string, unknown>).message as string)
      : response.statusText;

  // 翻译失败时降级为原文，不掩盖原始错误
  let message = rawMessage;
  if (rawMessage) {
    try {
      message = await translateError(rawMessage, getClientLocale());
    } catch {
      // 保持原文
    }
  }

  throw new HttpError(message || `Request failed: ${response.status}`, {
    status: response.status,
    data,
    response
  });
}
