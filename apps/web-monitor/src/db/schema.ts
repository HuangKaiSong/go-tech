import {
  bigint,
  char,
  customType,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  text,
  varchar
} from 'drizzle-orm/mysql-core';

const milliseconds = (name: string) => bigint(name, { mode: 'number' }).notNull();
const blob = customType<{ data: Buffer }>({ dataType: () => 'mediumblob' });
export const reports = mysqlTable(
  'monitor_reports',
  {
    id: char('id', { length: 36 }).primaryKey(),
    schemaVersion: int('schema_version').notNull(),
    reportKind: varchar('report_kind', { length: 16 }).notNull(),
    errorKind: varchar('error_kind', { length: 32 }),
    occurredAt: milliseconds('occurred_at_ms'),
    receivedAt: milliseconds('received_at_ms'),
    expiresAt: milliseconds('expires_at_ms'),
    timeSource: varchar('time_source', { length: 16 }),
    sessionId: char('session_id', { length: 36 }).notNull(),
    pageId: char('page_id', { length: 36 }).notNull(),
    path: text('path').notNull(),
    pathHash: char('path_hash', { length: 64 }).notNull(),
    release: varchar('release', { length: 100 }).notNull(),
    userId: varchar('user_id', { length: 100 }),
    summary: json('summary_json').notNull(),
    replayEventCount: int('replay_event_count').notNull(),
    payloadHash: char('payload_sha256', { length: 64 }).notNull()
  },
  table => [
    index('reports_received').on(table.receivedAt, table.id),
    index('reports_kind').on(table.reportKind, table.receivedAt, table.id),
    index('reports_session').on(table.sessionId, table.receivedAt, table.id),
    index('reports_path').on(table.pathHash, table.receivedAt, table.id),
    index('reports_expiry').on(table.expiresAt, table.id)
  ]
);
export const payloads = mysqlTable('monitor_report_payloads', {
  reportId: char('report_id', { length: 36 })
    .primaryKey()
    .references(() => reports.id, { onDelete: 'cascade' }),
  payload: json('payload_json').notNull(),
  authCiphertext: customType<{ data: string }>({ dataType: () => 'mediumtext' })('auth_ciphertext'),
  authKeyVersion: varchar('auth_key_version', { length: 32 })
});
export const replays = mysqlTable('monitor_replays', {
  reportId: char('report_id', { length: 36 })
    .primaryKey()
    .references(() => reports.id, { onDelete: 'cascade' }),
  codec: varchar('codec', { length: 16 }).notNull(),
  events: blob('events_blob').notNull(),
  uncompressedBytes: int('uncompressed_bytes').notNull(),
  hash: char('sha256', { length: 64 }).notNull()
});
export const importRuns = mysqlTable('monitor_import_runs', {
  id: char('id', { length: 36 }).primaryKey(),
  sourceHash: char('source_hash', { length: 64 }).notNull(),
  startedAt: milliseconds('started_at_ms'),
  completedAt: bigint('completed_at_ms', { mode: 'number' }),
  status: varchar('status', { length: 16 }).notNull()
});
export const importItems = mysqlTable(
  'monitor_import_items',
  {
    sourceHash: char('source_hash', { length: 64 }).notNull(),
    fileId: char('file_id', { length: 36 }).notNull(),
    contentHash: char('content_hash', { length: 64 }),
    runId: char('run_id', { length: 36 })
      .notNull()
      .references(() => importRuns.id),
    status: varchar('status', { length: 32 }).notNull(),
    errorClass: varchar('error_class', { length: 32 }),
    checkedAt: milliseconds('checked_at_ms')
  },
  table => [primaryKey({ columns: [table.sourceHash, table.fileId] })]
);
