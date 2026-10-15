import { randomUUID } from 'node:crypto';
import { type MonitorReport, REPORT_CHUNK_BYTES, type ReportChunk } from '@go-tech/monitor-contract';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { type Connection, type RowDataPacket, createConnection } from 'mysql2/promise';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { monitorComments } from '../src/db/comments';
import { createMonitorServer } from '../src/server';
import { ReportCodec } from '../src/storage/codec';
import { MysqlReportStore } from '../src/storage/mysql-report-store';
import { fixture } from './fixtures';
import { storageContract } from './storage-contract';

function chunks(report: MonitorReport, chunkBytes = REPORT_CHUNK_BYTES): ReportChunk[] {
  const bytes = Buffer.from(JSON.stringify(report));
  const total = Math.ceil(bytes.length / chunkBytes);
  const uploadId = randomUUID();
  return Array.from({ length: total }, (_, index) => ({
    protocol: 'monitor-chunk-v1',
    id: report.id,
    uploadId,
    index,
    total,
    ...(chunkBytes !== REPORT_CHUNK_BYTES ? { chunkBytes } : {}),
    data: bytes.subarray(index * chunkBytes, (index + 1) * chunkBytes).toString('base64')
  }));
}

const testUrl = process.env.MONITOR_TEST_DATABASE_URL;
describe.skipIf(!testUrl)('MySQL storage and schema migrations', () => {
  const database = `monitor_test_${randomUUID().replaceAll('-', '')}`;
  let admin: Connection;
  let store: MysqlReportStore;
  let second: MysqlReportStore;
  beforeAll(async () => {
    const url = new URL(testUrl ?? 'mysql://root@localhost');
    admin = await createConnection(url.toString());
    await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
    url.pathname = `/${database}`;
    const client = await createConnection(url.toString());
    try {
      await client.query('CREATE TABLE __drizzle_migrations (id INT PRIMARY KEY, hash TEXT, created_at BIGINT)');
      await client.query("INSERT INTO __drizzle_migrations VALUES (1,'business-journal-sentinel',9999999999999)");
      await migrate(drizzle(client), { migrationsFolder: './drizzle', migrationsTable: 'monitor_schema_migrations' });
    } finally {
      await client.end();
    }
    const options = {
      url: url.toString(),
      retentionMs: 86400000,
      maxReports: 100,
      codec: new ReportCodec('v1', { v1: '01'.repeat(32) }),
      batchSize: 100
    };
    store = new MysqlReportStore(options);
    second = new MysqlReportStore(options);
    await store.initialize();
    await second.initialize();
  });
  beforeEach(async () => {
    await store.connection(async connection => {
      await store.query(connection, 'DELETE FROM monitor_reports');
      await store.query(connection, 'DELETE FROM monitor_upload_chunks');
      await store.query(connection, 'DELETE FROM monitor_import_items');
      await store.query(connection, 'DELETE FROM monitor_import_runs');
    });
  });
  afterAll(async () => {
    await store?.close();
    await second?.close();
    if (admin) {
      await admin.query(`DROP DATABASE \`${database}\``);
      await admin.end();
    }
  });
  it('keeps the business migration journal independent in the shared database', async () => {
    const rows = await store.connection(connection =>
      store.query<RowDataPacket[]>(connection, 'SELECT hash,created_at FROM __drizzle_migrations')
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].hash).toBe('business-journal-sentinel');
    const monitor = await store.connection(connection =>
      store.query<RowDataPacket[]>(connection, 'SELECT COUNT(*) AS total FROM monitor_schema_migrations')
    );
    expect(Number(monitor[0].total)).toBe(4);
  });
  it('applies Chinese comments to every monitor table and column', async () => {
    const databaseStore = store;
    for (const [name, metadata] of Object.entries(monitorComments)) {
      // oxlint-disable-next-line no-await-in-loop -- Verify deployed metadata for each monitored table, including the migration journal.
      await databaseStore.connection(async connection => {
        const [table] = await databaseStore.query<RowDataPacket[]>(
          connection,
          'SELECT TABLE_COMMENT AS description FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?',
          [name]
        );
        expect(table?.description).toBe(metadata.table);
        const fields = await databaseStore.query<RowDataPacket[]>(
          connection,
          'SELECT COLUMN_NAME AS name,COLUMN_COMMENT AS description FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=?',
          [name]
        );
        expect(Object.fromEntries(fields.map(field => [field.name, field.description]))).toEqual(metadata.columns);
      });
    }
  });
  it('satisfies the shared storage contract', async () => {
    await storageContract(store);
  });
  it('inserts one complete report for two concurrent instances and encrypts credentials', async () => {
    const report = fixture();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) => (index % 2 ? second : store).save(report))
    );
    expect(results.filter(result => !result.duplicate)).toHaveLength(1);
    expect((await second.getStored(report.id))?.report).toEqual(report);
    const [row] = await store.connection(connection =>
      store.query<RowDataPacket[]>(
        connection,
        'SELECT payload_json,auth_ciphertext FROM monitor_report_payloads WHERE report_id=?',
        [report.id]
      )
    );
    expect(JSON.stringify(row)).not.toContain('secret-test');
  });
  it('serves ingestion, authenticated details and replay from two actual receivers', async () => {
    const servers = [store, second].map(adapter =>
      createMonitorServer(adapter, { ingest: 'ingest-test', query: 'query-test' })
    );
    const urls: string[] = [];
    try {
      for (const server of servers) {
        // oxlint-disable-next-line no-await-in-loop -- Acquire independent ephemeral ports for two service instances.
        await new Promise<void>(resolve => {
          server.listen(0, '127.0.0.1', resolve);
        });
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Missing address');
        urls.push(`http://127.0.0.1:${address.port}`);
      }
      const report = fixture();
      const responses = await Promise.all(
        urls.map(url =>
          fetch(`${url}/api/reports`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ingest-test', 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
          })
        )
      );
      expect(responses.map(response => response.status).toSorted()).toEqual([200, 201]);
      const headers = { Authorization: 'Bearer query-test' };
      const detail = await (await fetch(`${urls[1]}/api/reports/${report.id}`, { headers })).json();
      if (typeof detail !== 'object' || detail === null || !('data' in detail)) throw new Error('Invalid detail');
      expect(detail.data).toEqual(report);
      const replay = await (await fetch(`${urls[0]}/api/reports/${report.id}/replay`, { headers })).json();
      expect(replay).toEqual(report.kind === 'error' ? report.replay.events : []);
      expect((await fetch(`${urls[0]}/api/reports/${report.id}`)).status).toBe(401);
    } finally {
      await Promise.all(
        servers.map(
          server =>
            new Promise<void>((resolve, reject) => {
              server.close(error => (error ? reject(error) : resolve()));
              server.closeAllConnections();
            })
        )
      );
    }
  });
  it('rolls back every table when payload insertion fails', async () => {
    await store.connection(connection =>
      store.query(
        connection,
        "CREATE TRIGGER fail_payload BEFORE INSERT ON monitor_report_payloads FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='synthetic failure'"
      )
    );
    const report = fixture();
    try {
      await expect(store.save(report)).rejects.toThrow();
      expect(await store.hash(report.id)).toBeNull();
    } finally {
      await store.connection(connection => store.query(connection, 'DROP TRIGGER fail_payload'));
    }
  });
  it('paginates equal millisecond keys and hides expired data even before cleanup', async () => {
    const receivedAt = Date.now();
    const reports = Array.from({ length: 6 }, () => fixture());
    await Promise.all(reports.map(report => store.saveStored({ report, receivedAt })));
    const ordered = reports
      .map(report => report.id)
      .toSorted()
      .toReversed();
    const page = await store.list({ limit: 2 });
    expect(page.items.map(item => item.id)).toEqual(ordered.slice(0, 2));
    expect((await store.list({ limit: 2, cursor: page.nextCursor ?? undefined })).items.map(item => item.id)).toEqual(
      ordered.slice(2, 4)
    );
    await store.connection(connection =>
      store.query(connection, 'UPDATE monitor_reports SET expires_at_ms=0 WHERE id=?', [ordered[1]])
    );
    expect(await store.getStored(ordered[1])).toBeNull();
    expect((await store.list({ limit: 2, cursor: ordered[1] })).items).toHaveLength(0);
    await store.prune();
    const [count] = await store.connection(connection =>
      store.query<RowDataPacket[]>(connection, 'SELECT COUNT(*) AS count FROM monitor_report_payloads')
    );
    expect(Number(count?.count)).toBe(5);
  });
  it('rolls back summary and payload when replay insertion fails', async () => {
    await store.connection(connection =>
      store.query(
        connection,
        "CREATE TRIGGER fail_replay BEFORE INSERT ON monitor_replays FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='synthetic failure'"
      )
    );
    const report = fixture();
    try {
      await expect(store.save(report)).rejects.toThrow();
      expect(await store.hash(report.id)).toBeNull();
    } finally {
      await store.connection(connection => store.query(connection, 'DROP TRIGGER fail_replay'));
    }
  });
  it('preserves the exact IEEE floating point representation of performance metrics', async () => {
    const report = fixture('performance');
    report.metrics = [
      { id: 'metric', name: 'LCP', value: 10923.123456789013, rating: 'good', navigationType: 'navigate' },
      { id: 'metric2', name: 'CLS', value: Number('0.12345678901234567'), rating: 'good', navigationType: 'navigate' }
    ];
    await store.save(report);
    expect((await store.getStored(report.id))?.report.metrics).toEqual(report.metrics);
    expect((await store.list({ limit: 1 })).items[0].metrics).toEqual(report.metrics);
  });
  it('preserves long Unicode credentials without truncating ciphertext', async () => {
    const report = fixture();
    report.context.authentication = { status: 'unverified', token: '密'.repeat(16000), cookie: '密'.repeat(24000) };
    await store.save(report);
    expect((await store.getStored(report.id))?.report).toEqual(report);
  });
  it('handles a nearly 4 MiB report and refuses a report beyond the transport boundary', async () => {
    const report = fixture();
    if (report.kind !== 'error') throw new Error('Invalid fixture');
    report.replay.events[0].data = { node: { text: 'x'.repeat(4 * 1024 * 1024 - 2048) } };
    await store.save(report);
    expect((await store.getStored(report.id))?.report).toEqual(report);
    report.id = randomUUID();
    report.replay.events[0].data = { node: { text: 'x'.repeat(4 * 1024 * 1024) } };
    await expect(store.save(report)).rejects.toThrow('too large');
    expect(await store.hash(report.id)).toBeNull();
  });
  it('cleans quantity limits with multiple maintenance instances and coherent detail reads', async () => {
    const capped = new MysqlReportStore({ ...store.options, maxReports: 2 });
    const reports = Array.from({ length: 8 }, () => fixture());
    try {
      await Promise.all(reports.map(report => store.save(report)));
      const reads = reports.map(report => second.getStored(report.id));
      await Promise.all([capped.prune(), capped.prune(), ...reads]);
      expect((await capped.list({ limit: 100 })).items).toHaveLength(2);
      for (const stored of await Promise.all(reads)) if (stored) expect(stored.report.kind).toBe('error');
      const [count] = await store.connection(connection =>
        store.query<RowDataPacket[]>(connection, 'SELECT COUNT(*) AS total FROM monitor_replays')
      );
      expect(Number(count?.total)).toBe(2);
    } finally {
      await capped.close();
    }
  });
  it('fails unavailable database initialization instead of falling back to files', async () => {
    const unavailable = new MysqlReportStore({
      ...store.options,
      url: 'mysql://root@127.0.0.1:1/missing',
      timeoutMs: 100
    });
    try {
      await expect(unavailable.initialize()).rejects.toThrow();
      await expect(unavailable.save(fixture())).rejects.toThrow();
    } finally {
      await unavailable.close();
    }
  });
  it('rejects malformed times and unavailable authentication keys', async () => {
    const report = fixture();
    report.timestamp = 0.5;
    await expect(store.save(report)).rejects.toThrow('losslessly');
    const value = fixture();
    await store.save(value);
    await store.connection(connection =>
      store.query(connection, "UPDATE monitor_report_payloads SET auth_key_version='missing' WHERE report_id=?", [
        value.id
      ])
    );
    await expect(store.getStored(value.id)).rejects.toThrow('key version');
  });
  it('resumes chunks through another instance, commits once and clears staging', async () => {
    const report = fixture();
    delete report.context.authentication;
    if (report.kind === 'error') report.replay.events[0].data = { text: '界面'.repeat(10000) };
    const parts = chunks(report);
    expect(parts.length).toBeGreaterThan(2);
    expect(await store.saveChunk(parts[0])).toMatchObject({ complete: false, nextIndex: 1 });
    expect(await second.saveChunk(parts[0])).toMatchObject({ complete: false, nextIndex: 1 });
    for (const part of parts.slice(1)) {
      // oxlint-disable-next-line no-await-in-loop -- Exercise sequential resumable acknowledgements.
      await second.saveChunk(part, { status: 'unverified' });
    }
    const saved = await store.getStored(report.id);
    expect(saved?.report).toEqual({
      ...report,
      context: { ...report.context, authentication: { status: 'unverified' } }
    });
    expect(await store.saveChunk(parts.at(-1) ?? parts[0])).toMatchObject({ complete: true });
    expect((await store.list({ limit: 100 })).items).toHaveLength(1);
    const rows = await store.connection(connection =>
      store.query(connection, 'SELECT upload_id FROM monitor_upload_chunks')
    );
    expect(rows).toHaveLength(0);
  });
  it('rejects conflicting chunk bytes and client-supplied authentication', async () => {
    const report = fixture();
    const parts = chunks(report);
    await expect(store.saveChunk(parts[0])).rejects.toThrow('Invalid assembled report');
    delete report.context.authentication;
    if (report.kind === 'error') report.replay.events[0].data = { text: 'x'.repeat(30000) };
    const next = chunks(report);
    await store.saveChunk(next[0]);
    await expect(store.saveChunk({ ...next[0], data: Buffer.from('conflicting').toString('base64') })).rejects.toThrow(
      'Conflicting chunk data'
    );
    expect(await store.getStored(report.id)).toBeNull();
  });
  it('cleans expired staged chunks and requests the first missing fragment after partial expiry', async () => {
    const report = fixture();
    delete report.context.authentication;
    if (report.kind === 'error') report.replay.events[0].data = { text: 'x'.repeat(30000) };
    const parts = chunks(report);
    await store.saveChunk(parts[0]);
    await store.connection(connection =>
      store.query(connection, 'UPDATE monitor_upload_chunks SET expires_at_ms=?', [Date.now() - 1])
    );
    await store.prune();
    expect(await store.saveChunk(parts[1])).toMatchObject({ complete: false, nextIndex: 0 });
  });
  it('assembles adaptive 256 KiB chunks losslessly', async () => {
    const report = fixture();
    delete report.context.authentication;
    if (report.kind === 'error') report.replay.events[0].data = { text: '界面'.repeat(100000) };
    const parts = chunks(report, 262144);
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      // oxlint-disable-next-line no-await-in-loop -- Assemble actual adaptive chunks in order.
      await store.saveChunk(part);
    }
    expect((await store.getStored(report.id))?.report).toEqual(report);
  });
});
