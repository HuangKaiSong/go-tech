// oxlint-disable-next-line import/no-unassigned-import -- Admin credentials are confined to this server route.
import 'server-only';
import type { NextRequest } from 'next/server';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { queryMonitorAdmin } from '@/lib/browser-monitor/admin-query';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return queryMonitorAdmin(request, path, {
    serviceUrl: process.env.BROWSER_MONITOR_SERVICE_URL,
    queryToken: process.env.BROWSER_MONITOR_QUERY_TOKEN,
    authorize: async () => {
      const auth = await requireFeedbackAdmin(request);
      return auth.response;
    }
  });
}
