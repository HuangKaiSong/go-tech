import { NextResponse } from 'next/server';

export interface MobileHandoffStore {
  consume: (code: string, audience: string) => Promise<string | null>;
  issue: (authorization: string, audience: string) => Promise<string>;
}

const privateHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };

function mobileTarget() {
  const target = new URL(process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST ?? '');
  if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) {
    throw new Error('Invalid mobile host');
  }
  return target;
}

function json(code: number, message: string, headers: HeadersInit = privateHeaders) {
  return NextResponse.json({ code, message }, { status: code, headers });
}

export function createMobileHandoffHandlers(store: MobileHandoffStore) {
  return {
    async redirect(request: Request, mode: 'json' | 'redirect' = 'redirect') {
      const authorization = request.headers.get('authorization')?.trim();
      if (!authorization || !/^Bearer\s+[^\s]+$/i.test(authorization)) {
        return json(401, 'Missing or invalid Bearer authorization');
      }
      let target: URL;
      try {
        target = mobileTarget();
      } catch {
        return json(503, 'PMS mobile host is not configured correctly');
      }
      try {
        const code = await store.issue(authorization, target.origin);
        const fragment = target.hash.slice(1);
        const queryIndex = fragment.indexOf('?');
        let route = '';
        let query = fragment;
        if (fragment.startsWith('/')) {
          route = fragment;
          query = '';
          if (queryIndex >= 0) {
            route = fragment.slice(0, queryIndex);
            query = fragment.slice(queryIndex + 1);
          }
        }
        const params = new URLSearchParams(query);
        params.set('handoff_code', code);
        target.hash = `${route}${route ? '?' : ''}${params.toString()}`;
        if (mode === 'json') {
          return NextResponse.json({ code: 200, data: { url: target.toString() } }, { headers: privateHeaders });
        }
        return NextResponse.redirect(target, { status: 303, headers: privateHeaders });
      } catch (err) {
        console.error(err);
        return json(503, 'Unable to create mobile login handoff');
      }
    },
    async exchange(request: Request) {
      let origin: string;
      try {
        origin = mobileTarget().origin;
      } catch {
        return json(503, 'PMS mobile host is not configured correctly');
      }
      if (request.headers.get('origin') !== origin) return json(403, 'Origin is not allowed');
      const headers = {
        ...privateHeaders,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin'
      };
      if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers });
      try {
        // code 固定 43 字符，不接收凭证或任意跳转地址。
        if (Number(request.headers.get('content-length')) > 256) return json(400, 'Invalid handoff code', headers);
        const body = await request.text();
        if (body.length > 256) return json(400, 'Invalid handoff code', headers);
        const data: unknown = JSON.parse(body);
        if (
          !data ||
          typeof data !== 'object' ||
          !('code' in data) ||
          typeof data.code !== 'string' ||
          !/^[A-Za-z0-9_-]{43}$/.test(data.code)
        )
          return json(400, 'Invalid handoff code', headers);
        const authorization = await store.consume(data.code, origin);
        if (!authorization) return json(401, 'Handoff code has expired or already been used', headers);
        return NextResponse.json({ code: 200, data: { authorization } }, { headers });
      } catch (error) {
        return json(error instanceof SyntaxError ? 400 : 503, 'Unable to exchange mobile login handoff', headers);
      }
    }
  };
}
