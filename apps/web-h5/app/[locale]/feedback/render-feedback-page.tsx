// oxlint-disable-next-line import/no-unassigned-import -- Next.js enforces the server boundary through this import.
import 'server-only';

import { DrizzleQueryError } from 'drizzle-orm/errors';
import type { ReactNode } from 'react';
import FeedbackUnavailable from './feedback-unavailable';

/** Handle database failures without serializing query details to the browser. */
export async function renderFeedbackPage(render: () => Promise<ReactNode>) {
  try {
    return await render();
  } catch (error) {
    // Navigation signals (including notFound) and programming errors must still propagate.
    if (!(error instanceof DrizzleQueryError)) throw error;

    console.warn('Feedback database query failed. Feedback service is temporarily unavailable.');
    return <FeedbackUnavailable />;
  }
}
