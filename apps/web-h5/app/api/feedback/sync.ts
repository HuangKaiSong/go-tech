import { sql } from 'drizzle-orm';
import { after } from 'next/server';
import { fetchFeedbackAi } from '@/app/api/feedback/ai-client';
import { db } from '@/db';
import { fbAideSyncJob } from '@/db/scheam';

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SyncJobExecutor = typeof db | DatabaseTransaction;

export function enqueueFeedbackSync(executor: SyncJobExecutor, featureId: number) {
  return executor
    .insert(fbAideSyncJob)
    .values({ featureId })
    .onDuplicateKeyUpdate({
      set: {
        attempts: 0,
        availableAt: sql`CURRENT_TIMESTAMP`,
        lastError: null,
        revision: sql`${fbAideSyncJob.revision} + 1`
      }
    });
}

/** 在响应发送后消费任务；任务失败会留在 Outbox 中按退避时间重试。 */
export function scheduleFeedbackSync() {
  after(async () => {
    try {
      for (let batch = 0; batch < 5; batch += 1) {
        // oxlint-disable-next-line no-await-in-loop
        const response = await fetchFeedbackAi('/v1/sync/process', {
          body: JSON.stringify({ limit: 10 }),
          method: 'POST'
        });
        if (!response.ok) throw new Error(`Feedback AI sync returned HTTP ${response.status}`);
        // oxlint-disable-next-line no-await-in-loop
        const result = (await response.json()) as { processed: number };
        if (result.processed === 0) break;
      }
    } catch (error) {
      console.error('Feedback vector sync could not start', error);
    }
  });
}
