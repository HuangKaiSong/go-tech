import { reportListResponseSchema, reportSchema } from '@go-tech/monitor-contract';
import { z } from 'zod';

const base = '/h5-hook/api/browser-monitor/admin';
const messageSchema = z.object({ message: z.string().optional() });

async function request(path: string, signal: AbortSignal) {
  // AdminLayout supplies the existing admin bearer credential; query tokens remain on H5.
  const response = await fetch(`${base}${path}`, { signal, cache: 'no-store' });
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = messageSchema.safeParse(value);
    throw new Error(error.success && error.data.message ? error.data.message : '監控資料載入失敗');
  }
  return value;
}

export async function getMonitorReports(params: URLSearchParams, signal: AbortSignal) {
  const value = await request(`?${params}`, signal);
  const parsed = reportListResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error('監控列表資料格式不正確');
  return parsed.data.data;
}

export async function getMonitorReport(id: string, signal: AbortSignal) {
  const value = await request(`/${encodeURIComponent(id)}`, signal);
  const parsed = z.object({ code: z.literal(200), data: reportSchema }).safeParse(value);
  if (!parsed.success) throw new Error('監控記錄資料格式不正確');
  return parsed.data.data;
}
