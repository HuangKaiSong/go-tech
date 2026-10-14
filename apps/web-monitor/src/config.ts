import { ReportCodec } from './storage/codec';
import { MysqlReportStore } from './storage/mysql-report-store';

export function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${name}`);
  return value;
}
export function createMysqlStore(retentionMs: number, maxReports: number) {
  const url = process.env.MONITOR_DATABASE_URL;
  if (!url) throw new Error('MONITOR_DATABASE_URL is required');
  const version = process.env.MONITOR_AUTH_KEY_VERSION ?? 'v1';
  const previous: unknown = JSON.parse(process.env.MONITOR_AUTH_PREVIOUS_KEYS ?? '{}');
  if (
    typeof previous !== 'object' ||
    previous === null ||
    Array.isArray(previous) ||
    !Object.values(previous).every(value => typeof value === 'string')
  )
    throw new Error('Invalid previous authentication keys');
  const keys: Record<string, string> = {};
  for (const [name, value] of Object.entries(previous)) if (typeof value === 'string') keys[name] = value;
  keys[version] = process.env.MONITOR_AUTH_ENCRYPTION_KEY ?? '';
  return new MysqlReportStore({
    url,
    retentionMs,
    maxReports,
    codec: new ReportCodec(version, keys),
    connectionLimit: positiveInteger('MONITOR_DB_POOL_SIZE', 4),
    queueLimit: positiveInteger('MONITOR_DB_QUEUE_LIMIT', 32),
    timeoutMs: positiveInteger('MONITOR_DB_TIMEOUT_MS', 5000),
    batchSize: positiveInteger('MONITOR_DB_PRUNE_BATCH', 100)
  });
}
