import type { Instrumentation } from 'next';

/** Unhandled Server Component, Route Handler, Server Action and proxy failures. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const timestamp = Date.now();
  const { sendServerErrorReport } = await import('./lib/browser-monitor/server-report');
  const requestHeaders = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') requestHeaders.set(name, value);
    else if (Array.isArray(value)) requestHeaders.set(name, value.join(name.toLowerCase() === 'cookie' ? '; ' : ', '));
  }
  await sendServerErrorReport(
    error,
    {
      headers: requestHeaders,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType
    },
    {
      serviceUrl: process.env.BROWSER_MONITOR_SERVICE_URL,
      ingestToken: process.env.BROWSER_MONITOR_INGEST_TOKEN,
      jwtSecret: process.env.PLATFORM_JWT_SECRET,
      release: process.env.NEXT_PUBLIC_BROWSER_MONITOR_RELEASE,
      timestamp
    }
  );
};
