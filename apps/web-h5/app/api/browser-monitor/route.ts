import { withRuntimeScope } from '@/db';
import { relayMonitorReport } from '@/lib/browser-monitor/relay';
// oxlint-disable-next-line import/no-unassigned-import -- Enforces the server-only dependency boundary.
import 'server-only';
import { getRuntimeConfig } from '@/lib/runtime-config/server';

export const runtime = 'nodejs';

async function handlePOST(request: Request) {
  const { values } = await getRuntimeConfig();
  return relayMonitorReport(request, {
    allowedOrigins: values.BROWSER_MONITOR_ALLOWED_ORIGINS?.split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    serviceUrl: values.BROWSER_MONITOR_SERVICE_URL,
    ingestToken: values.BROWSER_MONITOR_INGEST_TOKEN,
    jwtSecret: values.PLATFORM_JWT_SECRET
  });
}

export const POST = withRuntimeScope(handlePOST);
