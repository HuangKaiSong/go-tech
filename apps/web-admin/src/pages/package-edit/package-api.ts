import type { PackageBizCode } from '@go-tech/types';
import { z } from 'zod';
import { buildPackagePayload, menuTreeSchema, parsePackage } from './package-model';
import type { MenuNode, PackageDraft } from './package-model';

const responseSchema = z.object({
  code: z.number(),
  data: z.unknown().optional(),
  message: z.string().nullish(),
  msg: z.string().nullish()
});

async function requestPackage(path: string, init?: RequestInit) {
  const response = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage${path}`, init);
  const raw: unknown = await response.json().catch(() => null);
  const result = responseSchema.safeParse(raw);
  if (!result.success) throw new Error('套餐服務回應異常，請稍後重試');
  if (!response.ok || result.data.code !== 200) {
    throw new Error(result.data.message || result.data.msg || '套餐請求失敗，請稍後重試');
  }
  return result.data.data;
}

export async function getPackage(id: string, signal: AbortSignal) {
  const data = await requestPackage(`/detail/${encodeURIComponent(id)}`, { signal });
  if (!data) throw new Error('找不到套餐資料');
  return parsePackage(data);
}

export async function getPackageMenuTree(bizCode: PackageBizCode, signal: AbortSignal) {
  const data = await requestPackage(`/menuTree?${new URLSearchParams({ bizCode })}`, { signal });
  const result = menuTreeSchema.safeParse(data);
  if (!result.success) throw new Error('功能選單格式不正確，請重新載入');
  return result.data;
}

export async function savePackage(draft: PackageDraft, menuTree: MenuNode[]) {
  const payload = buildPackagePayload(draft, menuTree);

  await requestPackage(payload.packageCode ? '/update' : '/add', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
}
