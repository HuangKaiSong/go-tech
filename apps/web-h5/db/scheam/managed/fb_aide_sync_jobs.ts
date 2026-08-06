import { sql } from 'drizzle-orm';
import { bigint, datetime, index, int, mysqlTable, text } from 'drizzle-orm/mysql-core';

/**
 * MySQL -> pgvector 增量同步 Outbox。
 *
 * 不设置 fb_feature 外键：需求被软删或未来被物理删除后，任务仍需保留， 以便消费者删除 PostgreSQL 中对应的旧向量。
 */
export const fbAideSyncJob = mysqlTable(
  'fb_aide_sync_job',
  {
    featureId: bigint('feature_id', { mode: 'number', unsigned: true }).primaryKey(),
    revision: int('revision', { unsigned: true }).notNull().default(1),
    attempts: int('attempts', { unsigned: true }).notNull().default(0),
    availableAt: datetime('available_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    lockedAt: datetime('locked_at'),
    lastError: text('last_error'),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
  },
  table => [index('idx_aide_sync_available').on(table.availableAt, table.lockedAt)]
);

export type FbAideSyncJob = typeof fbAideSyncJob.$inferSelect;
