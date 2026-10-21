import type { NextRequest } from 'next/server';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
// oxlint-disable-next-line import/no-unassigned-import -- Admin credentials are confined to this server route.
import 'server-only';
import { withRuntimeScope } from '@/db';
import { queryMonitorAdmin } from '@/lib/browser-monitor/admin-query';
import { getRuntimeConfig } from '@/lib/runtime-config/server';

export const runtime = 'nodejs';

async function handleGET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { values } = await getRuntimeConfig();
  const { path = [] } = await context.params;
  return queryMonitorAdmin(request, path, {
    serviceUrl: values.BROWSER_MONITOR_SERVICE_URL,
    queryToken: values.BROWSER_MONITOR_QUERY_TOKEN,
    authorize: async () => {
      const auth = await requireFeedbackAdmin(request);
      return auth.response;
    }
  });
}

export const GET = withRuntimeScope(handleGET);
