import { randomUUID } from 'node:crypto';

import mysql, { type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';

import { getMySQLConfig } from './config';
import { splitFeedbackDocuments } from './ingest';
import { loadDocumentFromMySQL } from './load-mysql';
import { createVectorStores } from './vector-store';

interface SyncJobRow extends RowDataPacket {
  attempts: number;
  feature_id: number;
  revision: number;
}

export interface ProcessPendingSyncJobsOptions {
  limit?: number;
}

export interface ProcessPendingSyncJobsResult {
  failed: number;
  processed: number;
  succeeded: number;
}

export async function syncFeature(featureId: number) {
  if (!Number.isSafeInteger(featureId) || featureId <= 0) throw new Error(`无效的 feature_id：${featureId}`);

  const document = await loadDocumentFromMySQL(featureId);
  const stores = await createVectorStores();

  try {
    if (!document) {
      const deletedChunkCount = await stores.deleteKnowledgeByFeatureId(featureId);
      return { action: 'removed' as const, chunkCount: deletedChunkCount, featureId };
    }

    const { chunks, syncVersion } = await splitFeedbackDocuments([document]);
    if (chunks.length > 0) {
      await stores.knowledge.addDocuments(chunks, { ids: chunks.map(() => randomUUID()) });
    }
    await stores.deleteKnowledgeByFeatureId(featureId, syncVersion);

    return { action: 'updated' as const, chunkCount: chunks.length, featureId };
  } finally {
    await stores.close();
  }
}

async function claimSyncJobs(limit: number) {
  const connection = await mysql.createConnection(getMySQLConfig().connectionString);

  try {
    await connection.beginTransaction();
    const [jobs] = await connection.query<SyncJobRow[]>(
      `
        SELECT feature_id, revision, attempts
        FROM fb_aide_sync_job
        WHERE available_at <= CURRENT_TIMESTAMP
          AND (locked_at IS NULL OR locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE))
        ORDER BY available_at, feature_id
        LIMIT ?
        FOR UPDATE SKIP LOCKED
      `,
      [limit]
    );

    for (const job of jobs) {
      // oxlint-disable-next-line no-await-in-loop
      await connection.execute(
        'UPDATE fb_aide_sync_job SET locked_at = CURRENT_TIMESTAMP WHERE feature_id = ? AND revision = ?',
        [job.feature_id, job.revision]
      );
    }
    await connection.commit();
    return jobs;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

async function completeSyncJob(featureId: number, revision: number) {
  const connection = await mysql.createConnection(getMySQLConfig().connectionString);
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM fb_aide_sync_job WHERE feature_id = ? AND revision = ?',
      [featureId, revision]
    );
    if (result.affectedRows === 0) {
      await connection.execute<ResultSetHeader>(
        'UPDATE fb_aide_sync_job SET locked_at = NULL WHERE feature_id = ? AND revision <> ?',
        [featureId, revision]
      );
    }
  } finally {
    await connection.end();
  }
}

async function failSyncJob(job: SyncJobRow, error: unknown) {
  const connection = await mysql.createConnection(getMySQLConfig().connectionString);
  const attempts = job.attempts + 1;
  const delaySeconds = Math.min(2 ** Math.min(attempts, 10) * 15, 3600);
  const message = error instanceof Error ? error.message : String(error);

  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        UPDATE fb_aide_sync_job
        SET attempts = ?,
            available_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND),
            locked_at = NULL,
            last_error = ?
        WHERE feature_id = ? AND revision = ?
      `,
      [attempts, delaySeconds, message.slice(0, 2000), job.feature_id, job.revision]
    );
    if (result.affectedRows === 0) {
      await connection.execute<ResultSetHeader>(
        'UPDATE fb_aide_sync_job SET locked_at = NULL WHERE feature_id = ? AND revision <> ?',
        [job.feature_id, job.revision]
      );
    }
  } finally {
    await connection.end();
  }
}

export async function processPendingSyncJobs({ limit = 5 }: ProcessPendingSyncJobsOptions = {}) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const jobs = await claimSyncJobs(safeLimit);
  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      // oxlint-disable-next-line no-await-in-loop
      await syncFeature(job.feature_id);
      // oxlint-disable-next-line no-await-in-loop
      await completeSyncJob(job.feature_id, job.revision);
      succeeded += 1;
    } catch (error) {
      console.error(`同步 feature_id=${job.feature_id} 失败`, error);
      // oxlint-disable-next-line no-await-in-loop
      await failSyncJob(job, error);
      failed += 1;
    }
  }

  return { failed, processed: jobs.length, succeeded } satisfies ProcessPendingSyncJobsResult;
}
