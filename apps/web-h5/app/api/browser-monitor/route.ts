// oxlint-disable-next-line import/no-unassigned-import -- Enforces the server-only dependency boundary.
import 'server-only';
import { relayMonitorReport } from '@/lib/browser-monitor/relay';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return relayMonitorReport(request, {
    allowedOrigins: process.env.BROWSER_MONITOR_ALLOWED_ORIGINS?.split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    serviceUrl: process.env.BROWSER_MONITOR_SERVICE_URL,
    ingestToken: process.env.BROWSER_MONITOR_INGEST_TOKEN,
    jwtSecret: process.env.PLATFORM_JWT_SECRET
  });
}
