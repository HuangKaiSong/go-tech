import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { MonitorReport } from '@go-tech/monitor-contract';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { createConnection } from 'mysql2/promise';
import { positiveInteger } from '../src/config';
import { ReportCodec, sha256, storedHash } from '../src/storage/codec';
import { MysqlReportStore } from '../src/storage/mysql-report-store';
import { summarize } from '../src/storage/report-store';

// Always creates and drops an isolated schema; never modifies tables at the supplied URL.
const databaseUrl = process.env.MONITOR_TEST_DATABASE_URL;
if (!databaseUrl) throw new Error('MONITOR_TEST_DATABASE_URL is required');
const database = `monitor_bench_${randomUUID().replaceAll('-', '')}`;
const admin = await createConnection(databaseUrl);
const url = new URL(databaseUrl);
url.pathname = `/${database}`;
let store: MysqlReportStore | undefined;
function report(): MonitorReport {
  return {
    schemaVersion: 1,
    id: randomUUID(),
    timestamp: Date.now(),
    kind: 'performance',
    hasError: false,
    metrics: [],
    context: {
      app: 'web-h5',
      sessionId: randomUUID(),
      pageId: randomUUID(),
      path: '/benchmark',
      release: 'benchmark',
      userAgent: 'synthetic',
      language: 'en',
      viewport: { width: 100, height: 100 }
    }
  };
}
function percentile(values: number[]) {
  return values.toSorted((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
}
try {
  await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  const client = await createConnection(url.toString());
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle', migrationsTable: 'monitor_schema_migrations' });
  } finally {
    await client.end();
  }
  store = new MysqlReportStore({
    url: url.toString(),
    retentionMs: 86400000,
    maxReports: 10000,
    codec: new ReportCodec('v1', { v1: '01'.repeat(32) })
  });
  const count = positiveInteger('MONITOR_BENCH_REPORTS', 100000);
  const seedStart = performance.now();
  for (let offset = 0; offset < count; offset += 100) {
    const items = Array.from({ length: Math.min(100, count - offset) }, () => ({
      report: report(),
      receivedAt: Date.now()
    }));
    // oxlint-disable-next-line no-await-in-loop -- Seed bounded transactional batches, avoiding per-row latency in fixture setup.
    await store.connection(async connection => {
      await connection.beginTransaction();
      try {
        await store?.query(
          connection,
          `INSERT INTO monitor_reports (id,schema_version,report_kind,occurred_at_ms,received_at_ms,expires_at_ms,session_id,page_id,path,path_hash,\`release\`,summary_json,replay_event_count,payload_sha256) VALUES ?`,
          [
            items.map(item => [
              item.report.id,
              1,
              'performance',
              item.report.timestamp,
              item.receivedAt,
              item.receivedAt + 86400000,
              item.report.context.sessionId,
              item.report.context.pageId,
              '/benchmark',
              sha256('/benchmark'),
              'benchmark',
              JSON.stringify(JSON.stringify(summarize(item.report, item.receivedAt))),
              0,
              storedHash(item)
            ])
          ]
        );
        await store?.query(connection, 'INSERT INTO monitor_report_payloads (report_id,payload_json) VALUES ?', [
          items.map(item => [item.report.id, JSON.stringify(JSON.stringify(item.report))])
        ]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }
  const seedMs = performance.now() - seedStart;
  const before = process.memoryUsage().heapUsed;
  const startup = performance.now();
  await store.initialize();
  const startupMs = performance.now() - startup;
  const startupHeapDelta = process.memoryUsage().heapUsed - before;
  const queryTimes: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    const start = performance.now();
    // oxlint-disable-next-line no-await-in-loop -- Sample request latency at a fixed total data size.
    await store.list({ limit: 20, path: '/benchmark' });
    queryTimes.push(performance.now() - start);
  }
  const writeTimes: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- Four concurrent writers match the provisional local load budget.
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        const start = performance.now();
        await store?.save(report());
        writeTimes.push(performance.now() - start);
      })
    );
  }
  const prune = performance.now();
  await store.prune();
  const pruneMs = performance.now() - prune;
  console.log(
    JSON.stringify({
      reports: count,
      concurrency: 4,
      seedMs,
      startupMs,
      startupHeapDelta,
      listP95Ms: percentile(queryTimes),
      writeP95Ms: percentile(writeTimes),
      pruneBatchMs: pruneMs,
      heapUsedBytes: process.memoryUsage().heapUsed
    })
  );
} catch {
  console.error('Benchmark failed; isolated schema will be removed.');
  process.exitCode = 1;
} finally {
  await store?.close();
  await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await admin.end();
}
