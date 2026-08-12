import { atom } from 'jotai';

export const TENANT_CACHE_STALE_TIME = 60_000;

export type TenantCacheStatus = 'error' | 'idle' | 'loading' | 'success';

export interface TenantCacheState {
  data: Tenant[];
  error: string | null;
  fetchedAt: number | null;
  ownerId: string | null;
  status: TenantCacheStatus;
}

interface TenantResponse {
  code?: number;
  data?: unknown;
  message?: string;
}

const emptyTenantCache: TenantCacheState = {
  data: [],
  error: null,
  fetchedAt: null,
  ownerId: null,
  status: 'idle'
};

interface PendingTenantRequest {
  controller: AbortController;
  promise: Promise<Tenant[]>;
}

const inFlightRequests = new Map<string, PendingTenantRequest>();
const tenantRequestCancelledError = new Error('Tenant request cancelled');

export const tenantCacheAtom = atom<TenantCacheState>(emptyTenantCache);

export function createTenantCache(ownerId: string | null, data: Tenant[] = [], fresh = false): TenantCacheState {
  return {
    data,
    error: null,
    fetchedAt: fresh ? Date.now() : null,
    ownerId,
    status: fresh ? 'success' : 'idle'
  };
}

export function isTenantCacheFresh(cache: TenantCacheState, ownerId: string) {
  return (
    cache.ownerId === ownerId &&
    cache.status === 'success' &&
    cache.fetchedAt !== null &&
    Date.now() - cache.fetchedAt < TENANT_CACHE_STALE_TIME
  );
}

export function requestTenants(voucher: string, ownerId: string) {
  const pendingRequest = inFlightRequests.get(ownerId);
  if (pendingRequest) return pendingRequest.promise;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Tenant request timed out after 3000ms')), 3_000);
  const request = fetch('/go-tech/platform/packageOrder/myTenants', {
    headers: {
      Authorization: `Bearer ${voucher}`
    },
    signal: controller.signal
  })
    .then(async response => {
      const result = (await response.json()) as TenantResponse;

      if (!response.ok || (result.code !== undefined && result.code !== 200) || !Array.isArray(result.data)) {
        throw new Error(result.message || `Failed to fetch tenants (${response.status})`);
      }

      return result.data as Tenant[];
    })
    .finally(() => {
      clearTimeout(timeoutId);
      if (inFlightRequests.get(ownerId)?.promise === request) {
        inFlightRequests.delete(ownerId);
      }
    });

  inFlightRequests.set(ownerId, { controller, promise: request });
  return request;
}

export function cancelTenantRequest(ownerId: string | null) {
  if (!ownerId) return;

  const pendingRequest = inFlightRequests.get(ownerId);
  if (!pendingRequest) return;

  inFlightRequests.delete(ownerId);
  pendingRequest.controller.abort(tenantRequestCancelledError);
}

export function isTenantRequestCancellation(error: unknown) {
  return error === tenantRequestCancelledError;
}
