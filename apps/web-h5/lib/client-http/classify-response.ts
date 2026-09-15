import type { BusinessCode, ClientHttpErrorKind } from './client-http-error';

const MAX_USER_MESSAGE_LENGTH = 500;

export type ResponseClassification =
  | { ok: true }
  | {
      businessCode?: BusinessCode;
      kind: Exclude<ClientHttpErrorKind, 'network'>;
      ok: false;
      status?: number;
      userMessage?: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeUserMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const message = value.trim();
  return message ? message.slice(0, MAX_USER_MESSAGE_LENGTH) : undefined;
}

function getResponseMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;

  return (
    normalizeUserMessage(payload.message) || normalizeUserMessage(payload.msg) || normalizeUserMessage(payload.error)
  );
}

function getBusinessCode(payload: unknown): BusinessCode | undefined {
  if (!isRecord(payload) || !Object.hasOwn(payload, 'code')) return undefined;

  const { code } = payload;
  return typeof code === 'number' || typeof code === 'string' ? code : undefined;
}

function isSuccessfulBusinessCode(code: BusinessCode) {
  return String(code) === '200';
}

async function readBodyCopy(response: Response) {
  const contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
  const isJson = contentType.includes('json');

  if (response.ok && !isJson) return { payload: undefined, text: undefined };

  const text = await response
    .clone()
    .text()
    .catch(() => '');

  if (!text) return { payload: undefined, text: undefined };
  if (!isJson) return { payload: undefined, text: normalizeUserMessage(text) };

  try {
    return { payload: JSON.parse(text) as unknown, text: undefined };
  } catch {
    return { payload: undefined, text: response.ok ? undefined : normalizeUserMessage(text) };
  }
}

/** 先检查平台业务码，再检查 HTTP 状态；成功响应不会消费调用方的原始 body。 */
export async function classifyResponse(response: Response): Promise<ResponseClassification> {
  const { payload, text } = await readBodyCopy(response);
  const businessCode = getBusinessCode(payload);

  if (businessCode !== undefined && !isSuccessfulBusinessCode(businessCode)) {
    return {
      businessCode,
      kind: 'business',
      ok: false,
      userMessage: getResponseMessage(payload)
    };
  }

  if (!response.ok) {
    return {
      kind: 'http',
      ok: false,
      status: response.status,
      userMessage: getResponseMessage(payload) || text
    };
  }

  return { ok: true };
}
