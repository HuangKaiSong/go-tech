import type { NextRequest } from 'next/server';
import { featureStatus } from '@/db/scheam';
import type { FeatureStatus } from '@/db/scheam';

export const ADMIN_PAGE_SIZE = 20;
export const MAX_ADMIN_PAGE_SIZE = 100;

export function parsePositiveInteger(value: string | null, fallback: number, maximum = Number.MAX_SAFE_INTEGER) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export function getPagination(req: NextRequest) {
  const page = parsePositiveInteger(req.nextUrl.searchParams.get('page'), 1);
  const pageSize = parsePositiveInteger(req.nextUrl.searchParams.get('pageSize'), ADMIN_PAGE_SIZE, MAX_ADMIN_PAGE_SIZE);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function isFeatureStatus(value: unknown): value is FeatureStatus {
  return typeof value === 'string' && featureStatus.includes(value as FeatureStatus);
}

export function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}
