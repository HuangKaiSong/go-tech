// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';

function feedbackAiConfig() {
  const token = process.env.FEEDBACK_AI_INTERNAL_TOKEN;
  if (!token) throw new Error('FEEDBACK_AI_INTERNAL_TOKEN is not configured');

  return {
    baseUrl: (process.env.FEEDBACK_AI_URL || 'http://127.0.0.1:8100').replace(/\/$/, ''),
    token
  };
}

export async function fetchFeedbackAi(path: string, init: RequestInit = {}) {
  const config = feedbackAiConfig();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Feedback-AI-Token', config.token);

  return fetch(`${config.baseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers
  });
}
