import { processPendingSyncJobs } from '@go-tech/feedback-ai';
import { sql } from 'drizzle-orm';
import { after } from 'next/server';
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
        const result = await processPendingSyncJobs({ limit: 10 });
        if (result.processed === 0) break;
      }
    } catch (error) {
      console.error('Feedback vector sync could not start', error);
    }
  });
}
