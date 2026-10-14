import { MAX_REPORT_BYTES, reportIdSchema, reportSchema, reportSummarySchema } from '@go-tech/monitor-contract';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { type PoolConnection, type RowDataPacket, createPool } from 'mysql2/promise';
import * as schema from '../db/schema';
import { ReportCodec, sha256, storedHash, validateStored } from './codec';
import { type ListFilter, type MonitorReportStore, type StoredReport, summarize } from './report-store';

interface ReportRow extends RowDataPacket {
  auth_ciphertext: string | null;
  auth_key_version: string | null;
  codec: string | null;
  events_blob: Buffer | null;
  id: string;
  payload_json: unknown;
  payload_sha256: string;
  received_at_ms: number;
  sha256: string | null;
  summary_json: unknown;
  uncompressed_bytes: number | null;
}
function jsonValue(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : value;
}
export interface MysqlOptions {
  batchSize?: number;
  codec: ReportCodec;
  connectionLimit?: number;
  maxReports: number;
  queueLimit?: number;
  retentionMs: number;
  timeoutMs?: number;
  url: string;
}
export class MysqlReportStore implements MonitorReportStore {
  readonly pool;
  private readonly statistics = { queries: 0, failures: 0, totalQueryMs: 0, maxQueryMs: 0 };
  metrics() {
    return { ...this.statistics };
  }
  private readonly timeout: number;
  private readonly batch: number;
  constructor(readonly options: MysqlOptions) {
    if (
      !Number.isSafeInteger(options.retentionMs) ||
      options.retentionMs < 1 ||
      !Number.isSafeInteger(options.maxReports) ||
      options.maxReports < 1
    )
      throw new Error('Invalid retention configuration');
    this.timeout = options.timeoutMs ?? 5000;
    this.batch = options.batchSize ?? 100;
    for (const value of [this.timeout, this.batch, options.connectionLimit ?? 4, options.queueLimit ?? 32]) {
      if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid database resource limit');
    }
    this.pool = createPool({
      uri: options.url,
      connectionLimit: options.connectionLimit ?? 4,
      queueLimit: options.queueLimit ?? 32,
      waitForConnections: true,
      connectTimeout: this.timeout,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: false
    });
  }
  async query<T extends RowDataPacket[]>(connection: PoolConnection, sql: string, values: unknown[] = []): Promise<T> {
    const started = performance.now();
    this.statistics.queries += 1;
    try {
      const [rows] = await connection.query<T>({ sql, values, timeout: this.timeout });
      return rows;
    } catch (error) {
      this.statistics.failures += 1;
      throw error;
    } finally {
      const elapsed = performance.now() - started;
      this.statistics.totalQueryMs += elapsed;
      this.statistics.maxQueryMs = Math.max(this.statistics.maxQueryMs, elapsed);
    }
  }
  async connection<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await new Promise<PoolConnection>((resolve, reject) => {
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        reject(new Error('Database connection queue timed out'));
      }, this.timeout);
      this.pool.getConnection().then(
        value => {
          clearTimeout(timer);
          if (expired) value.release();
          else resolve(value);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
    // A hard deadline destroys the connection, including a transaction blocked on a lock.
    const timer = setTimeout(() => connection.destroy(), this.timeout * 4);
    timer.unref();
    try {
      return await operation(connection);
    } finally {
      clearTimeout(timer);
      connection.release();
    }
  }
  async initialize() {
    await this.connection(async connection => {
      const [config] = await this.query<RowDataPacket[]>(
        connection,
        'SELECT @@max_allowed_packet AS packet, VERSION() AS version'
      );
      if (!config || Number(config.packet) < MAX_REPORT_BYTES * 2 + 65536)
        throw new Error('MySQL max_allowed_packet must be at least 16 MiB');
      if (!String(config.version).startsWith('8.')) throw new Error('MySQL 8 is required');
      for (const table of Object.values(schema)) {
        const definition = getTableConfig(table);
        // oxlint-disable-next-line no-await-in-loop -- Startup checks only five schema tables, never report contents.
        await this.query(
          connection,
          `SELECT ${definition.columns.map(column => `\`${column.name}\``).join(',')} FROM \`${definition.name}\` LIMIT 0`
        );
        // oxlint-disable-next-line no-await-in-loop -- Verify transactional storage for every owned table.
        const [engine] = await this.query<RowDataPacket[]>(
          connection,
          'SELECT ENGINE FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
          [definition.name]
        );
        if (engine?.ENGINE !== 'InnoDB') throw new Error('Monitor tables must use InnoDB');
      }
    });
  }
  save(report: StoredReport['report']) {
    return this.saveStored({ report, receivedAt: Date.now() });
  }
  async saveStored(stored: StoredReport) {
    validateStored(stored, this.options.retentionMs);
    const { receivedAt, report } = stored;
    const encoded = this.options.codec.encode(stored);
    const summary = summarize(report, receivedAt);
    // Store JSON strings inside JSON columns: MySQL object serialization can round IEEE floats.
    // Queries use extracted scalar columns, so payload and summary remain lossless opaque documents.
    return this.connection(async connection => {
      await connection.beginTransaction();
      try {
        try {
          await this.query(
            connection,
            `INSERT INTO monitor_reports (id,schema_version,report_kind,error_kind,occurred_at_ms,received_at_ms,expires_at_ms,time_source,session_id,page_id,path,path_hash,\`release\`,user_id,summary_json,replay_event_count,payload_sha256) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              report.id,
              report.schemaVersion,
              report.kind,
              report.kind === 'error' ? report.error.kind : null,
              report.timestamp,
              receivedAt,
              receivedAt + this.options.retentionMs,
              report.timeSource ?? null,
              report.context.sessionId,
              report.context.pageId,
              report.context.path,
              sha256(report.context.path),
              report.context.release,
              report.context.authentication?.userId ?? null,
              JSON.stringify(JSON.stringify(summary)),
              summary.replayEventCount,
              storedHash(stored)
            ]
          );
        } catch (error) {
          // Only this insert can encounter the report UUID primary key conflict.
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
            await connection.rollback();
            return { id: report.id, duplicate: true };
          }
          throw error;
        }
        await this.query(
          connection,
          'INSERT INTO monitor_report_payloads (report_id,payload_json,auth_ciphertext,auth_key_version) VALUES (?,?,?,?)',
          [
            report.id,
            JSON.stringify(JSON.stringify(encoded.payload)),
            encoded.ciphertext,
            encoded.ciphertext ? this.options.codec.version : null
          ]
        );
        if (encoded.replay)
          await this.query(
            connection,
            'INSERT INTO monitor_replays (report_id,codec,events_blob,uncompressed_bytes,sha256) VALUES (?,?,?,?,?)',
            [report.id, 'gzip-json', encoded.replay.events, encoded.replay.bytes, encoded.replay.hash]
          );
        await connection.commit();
        return { id: report.id, duplicate: false };
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }
  async hash(id: string) {
    return this.connection(async connection => {
      const [row] = await this.query<ReportRow[]>(
        connection,
        'SELECT payload_sha256 FROM monitor_reports WHERE id = ?',
        [id]
      );
      return row?.payload_sha256 ?? null;
    });
  }
  async getStored(id: string): Promise<StoredReport | null> {
    if (!reportIdSchema.safeParse(id).success) return null;
    return this.connection(async connection => {
      // One statement reads summary, payload and replay from the same MVCC snapshot.
      const [row] = await this.query<ReportRow[]>(
        connection,
        `SELECT r.id,r.received_at_ms,r.payload_sha256,p.payload_json,p.auth_ciphertext,p.auth_key_version,v.codec,v.events_blob,v.uncompressed_bytes,v.sha256 FROM monitor_reports r JOIN monitor_report_payloads p ON p.report_id=r.id LEFT JOIN monitor_replays v ON v.report_id=r.id WHERE r.id=? AND r.expires_at_ms>?`,
        [id, Date.now()]
      );
      if (!row) return null;
      const payload = jsonValue(row.payload_json);
      if (typeof payload !== 'object' || payload === null || !('context' in payload))
        throw new Error('Invalid stored payload');
      const context = payload.context;
      if (typeof context !== 'object' || context === null) throw new Error('Invalid stored context');
      if (row.auth_ciphertext) {
        if (!row.auth_key_version || !('authentication' in context))
          throw new Error('Invalid encrypted authentication');
        Object.assign(
          context.authentication ?? {},
          this.options.codec.decrypt(row.auth_ciphertext, row.auth_key_version, id)
        );
      }
      if (row.events_blob) {
        if (
          row.codec !== 'gzip-json' ||
          row.uncompressed_bytes === null ||
          row.sha256 === null ||
          !('replay' in payload) ||
          typeof payload.replay !== 'object' ||
          payload.replay === null
        )
          throw new Error('Invalid replay metadata');
        Object.assign(payload.replay, {
          events: ReportCodec.events(row.events_blob, row.uncompressed_bytes, row.sha256)
        });
      }
      const stored = { report: reportSchema.parse(payload), receivedAt: Number(row.received_at_ms) };
      if (storedHash(stored) !== row.payload_sha256) throw new Error('Report integrity check failed');
      return stored;
    });
  }
  async list(filter: ListFilter) {
    return this.connection(async connection => {
      const conditions = ['expires_at_ms > ?'];
      const values: unknown[] = [Date.now()];
      if (filter.cursor) {
        const [cursor] = await this.query<ReportRow[]>(
          connection,
          'SELECT received_at_ms,id FROM monitor_reports WHERE id=? AND expires_at_ms>?',
          [filter.cursor, values[0]]
        );
        if (!cursor) return { items: [], nextCursor: null };
        conditions.push('(received_at_ms < ? OR (received_at_ms = ? AND id < ?))');
        values.push(cursor.received_at_ms, cursor.received_at_ms, cursor.id);
      }
      if (filter.kind) {
        conditions.push('report_kind = ?');
        values.push(filter.kind);
      }
      if (filter.sessionId) {
        conditions.push('session_id = ?');
        values.push(filter.sessionId);
      }
      if (filter.path) {
        conditions.push('path_hash = ? AND BINARY path = BINARY ?');
        values.push(sha256(filter.path), filter.path);
      }
      const rows = await this.query<ReportRow[]>(
        connection,
        `SELECT summary_json FROM monitor_reports WHERE ${conditions.join(' AND ')} ORDER BY received_at_ms DESC,id DESC LIMIT ?`,
        [...values, filter.limit + 1]
      );
      const items = rows.slice(0, filter.limit).map(row => reportSummarySchema.parse(jsonValue(row.summary_json)));
      return { items, nextCursor: rows.length > filter.limit ? (items.at(-1)?.id ?? null) : null };
    });
  }
  async prune() {
    await this.connection(async connection => {
      const [lock] = await this.query<RowDataPacket[]>(
        connection,
        "SELECT GET_LOCK(CONCAT(DATABASE(), ':monitor-prune'),0) AS acquired"
      );
      if (Number(lock?.acquired) !== 1) return;
      try {
        // At most one batch per call bounds lock time and work, even with a large backlog.
        await connection.beginTransaction();
        try {
          await this.query(
            connection,
            'DELETE FROM monitor_reports WHERE expires_at_ms <= ? ORDER BY expires_at_ms,id LIMIT ?',
            [Date.now(), this.batch]
          );
          const [count] = await this.query<RowDataPacket[]>(
            connection,
            'SELECT COUNT(*) AS total FROM monitor_reports'
          );
          const excess = Math.min(this.batch, Math.max(0, Number(count?.total) - this.options.maxReports));
          if (excess)
            await this.query(connection, 'DELETE FROM monitor_reports ORDER BY received_at_ms,id LIMIT ?', [excess]);
          await this.query(
            connection,
            'DELETE FROM monitor_import_items WHERE checked_at_ms < ? AND status IN (?,?,?) LIMIT ?',
            [Date.now() - 30 * 86400000, 'imported', 'duplicate', 'expired', this.batch]
          );
          await this.query(
            connection,
            'DELETE FROM monitor_import_runs WHERE completed_at_ms < ? AND NOT EXISTS (SELECT 1 FROM monitor_import_items WHERE run_id=monitor_import_runs.id) LIMIT ?',
            [Date.now() - 30 * 86400000, this.batch]
          );
          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      } finally {
        await this.query(connection, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':monitor-prune'))");
      }
    });
  }
  close() {
    return this.pool.end();
  }
}
