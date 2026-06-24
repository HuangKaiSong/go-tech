// oxlint-disable
import 'server-only';
import { HttpClient, type HttpAdapter } from '@go-tech/core-http';
import { cookies } from 'next/headers';

export function getBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }

  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

/**
 * Next.js (server-only) adapter for the platform-agnostic HTTP kernel.
 * Reads the auth token from the request cookie and tags requests as a
 * platform customer.
 */
const nextAdapter: HttpAdapter = {
  getBaseUrl,
  async getToken() {
    const cookieStore = await cookies();
    return cookieStore.get('GO_TECH_AUTH_TOKEN')?.value || '';
  },
  defaultHeaders: { 'User-Type': 'platform_customer' },
  // Preserve legacy behavior: resolve with the response body even on non-ok.
  returnErrorBody: true
};

export const httpClient = new HttpClient(nextAdapter);
