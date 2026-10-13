import type { MonitorAuthentication } from '@go-tech/monitor-contract';
import { decodeJwt, jwtVerify } from 'jose';

function cookiesFrom(header: string) {
  return header.split(';').flatMap(part => {
    const separator = part.indexOf('=');
    if (separator < 1) return [];
    const name = part.slice(0, separator).trim();
    // Only authentication cookies are collected; form/password cookies never enter reports.
    if (!['GO_TECH_AUTH_TOKEN', 'session'].includes(name)) return [];
    return [[name, part.slice(separator + 1).trim()] as const];
  });
}

/** Identity is derived from the incoming request, never from client-supplied report fields. */
export async function monitorAuthentication(headers: Headers, secret?: string): Promise<MonitorAuthentication> {
  const cookies = cookiesFrom(headers.get('cookie') ?? '');
  const authorization = headers.get('authorization');
  const rawToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : cookies.find(([name]) => name === 'GO_TECH_AUTH_TOKEN')?.[1];
  let token = rawToken;
  try {
    if (token) token = decodeURIComponent(token);
  } catch {
    /* Retain the original malformed credential. */
  }
  const credentials = {
    token: token?.slice(0, 16000),
    cookie: cookies.length
      ? cookies
          .map(([name, value]) => `${name}=${value}`)
          .join('; ')
          .slice(0, 24000)
      : undefined
  };
  if (!token) return { status: cookies.length ? 'unverified' : 'anonymous', ...credentials };
  try {
    const payload = secret
      ? (await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS512'] })).payload
      : decodeJwt(token);
    const userId = payload.userId ?? payload.sub;
    return {
      ...credentials,
      status: secret ? 'verified' : 'unverified',
      userId: typeof userId === 'string' || typeof userId === 'number' ? String(userId).slice(0, 100) : undefined,
      username: typeof payload.username === 'string' ? payload.username.slice(0, 100) : undefined
    };
  } catch {
    return { ...credentials, status: 'invalid' };
  }
}
