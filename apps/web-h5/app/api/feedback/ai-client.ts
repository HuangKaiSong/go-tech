import { captureServerError } from '@/lib/browser-monitor/server';
import type { MonitorServerRequest } from '@/lib/browser-monitor/server-report';
// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';
import { configValue } from '@/lib/runtime-config/server';
import { serverFetch } from '@/lib/server-fetch';

async function feedbackAiConfig() {
  const token = await configValue('FEEDBACK_AI_INTERNAL_TOKEN');
  if (!token) throw new Error('FEEDBACK_AI_INTERNAL_TOKEN is not configured');

  return {
    baseUrl: ((await configValue('FEEDBACK_AI_URL')) || 'http://127.0.0.1:8100').replace(/\/$/, ''),
    token
  };
}

export async function fetchFeedbackAi(path: string, init: RequestInit = {}, request?: MonitorServerRequest) {
  let config: Awaited<ReturnType<typeof feedbackAiConfig>>;
  try {
    config = await feedbackAiConfig();
  } catch (error) {
    await captureServerError(error, request);
    throw error;
  }
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Feedback-AI-Token', config.token);

  return serverFetch(
    `${config.baseUrl}${path}`,
    {
      ...init,
      cache: 'no-store',
      headers
    },
    { inspectJson: true, request }
  );
}
