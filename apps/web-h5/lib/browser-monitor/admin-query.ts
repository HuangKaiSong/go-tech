import { reportIdSchema } from '@go-tech/monitor-contract';

interface QueryConfig {
  authorize: () => Promise<Response | undefined>;
  forward?: typeof fetch;
  queryToken?: string;
  serviceUrl?: string;
}

/** Every query authenticates the admin before contacting the private monitor service. */
export async function queryMonitorAdmin(request: Request, path: string[], config: QueryConfig) {
  const denied = await config.authorize();
  const forward = config.forward ?? fetch;
  if (denied) return denied;
  if (!config.serviceUrl || !config.queryToken) return reply(503, '監控查詢服務尚未配置');
  if (
    path.length > 2 ||
    (path.length && !reportIdSchema.safeParse(path[0]).success) ||
    (path.length === 2 && path[1] !== 'replay')
  ) {
    return reply(400, '無效的監控記錄地址');
  }
  const url = new URL(`/api/reports${path.length ? `/${path.join('/')}` : ''}`, config.serviceUrl);
  const incoming = new URL(request.url);
  for (const key of ['kind', 'limit', 'cursor', 'path', 'sessionId', 'from', 'to']) {
    const value = incoming.searchParams.get(key);
    if (value !== null && !path.length) url.searchParams.set(key, value);
  }
  try {
    const response = await forward(url, {
      headers: { Authorization: `Bearer ${config.queryToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      if (response.status === 404) return reply(404, '監控記錄不存在或已過期');
      if (response.status === 400) return reply(400, '無效的監控查詢條件');
      return reply(502, '監控服務暫時無法查詢');
    }
    // Keep the original validated service protocol (raw event array for /replay).
    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return reply(502, '監控服務暫時無法查詢');
  }
}

function reply(status: number, message: string) {
  return Response.json({ code: status, message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
