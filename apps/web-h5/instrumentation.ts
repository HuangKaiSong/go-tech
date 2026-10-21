import type { Instrumentation } from 'next';

/** Unhandled Server Component, Route Handler, Server Action and proxy failures. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const timestamp = Date.now();
  const { isServerErrorReported } = await import('./lib/browser-monitor/server-error-state');
  if (isServerErrorReported(error)) return;
  const { sendServerErrorReport } = await import('./lib/browser-monitor/server-report');
  const requestHeaders = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') requestHeaders.set(name, value);
    else if (Array.isArray(value)) requestHeaders.set(name, value.join(name.toLowerCase() === 'cookie' ? '; ' : ', '));
  }
  let values;
  try {
    values = (await (await import('./lib/runtime-config/service')).getRuntimeConfig()).values;
  } catch {
    return;
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
      serviceUrl: values.BROWSER_MONITOR_SERVICE_URL,
      ingestToken: values.BROWSER_MONITOR_INGEST_TOKEN,
      jwtSecret: values.PLATFORM_JWT_SECRET,
      release: values.NEXT_PUBLIC_BROWSER_MONITOR_RELEASE,
      timestamp
    }
  );
};
