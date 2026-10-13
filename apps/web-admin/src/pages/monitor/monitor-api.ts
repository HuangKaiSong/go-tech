import { reportListResponseSchema, reportSchema } from '@go-tech/monitor-contract';
import { z } from 'zod';

const base = '/h5-hook/api/browser-monitor/admin';
const messageSchema = z.object({ message: z.string().optional() });

export class MonitorApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    override readonly cause?: unknown
  ) {
    super(message);
    this.name = 'MonitorApiError';
  }
}

async function request(path: string, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { signal, cache: 'no-store' });
  } catch (error) {
    // AbortError 需要原样抛出，React Query 靠它识别取消
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new MonitorApiError('無法連接伺服器，請檢查網路後重試', undefined, { cause: error });
  }

  const value: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = messageSchema.safeParse(value);
    const message = parsed.success && parsed.data.message ? parsed.data.message : fallbackMessage(response.status);
    throw new MonitorApiError(message, response.status);
  }

  return value;
}

function fallbackMessage(status: number) {
  if (status === 401) return '登入已過期，請重新登入';
  if (status === 403) return '沒有查看監控資料的權限';
  if (status >= 500) return '伺服器暫時無法處理請求，請稍後重試';
  return '監控資料載入失敗';
}

export async function getMonitorReports(params: URLSearchParams, signal: AbortSignal) {
  const value = await request(`?${params}`, signal);
  const parsed = reportListResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error('監控列表資料格式不正確');
  return parsed.data.data;
}

export async function getMonitorReport(id: string, signal: AbortSignal) {
  const value = await request(`/${encodeURIComponent(id)}`, signal);
  const parsed = z
    .object({ code: z.literal(200), data: reportSchema, receivedAt: z.number().finite().nonnegative().optional() })
    .safeParse(value);
  if (!parsed.success) throw new Error('監控記錄資料格式不正確');
  return { ...parsed.data.data, receivedAt: parsed.data.receivedAt };
}
