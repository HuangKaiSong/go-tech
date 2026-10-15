import {
  MAX_REPORT_BYTES,
  type MonitorAuthentication,
  REPORT_CHUNK_BYTES,
  type ReportChunk,
  reportSchema
} from '@go-tech/monitor-contract';
import type { RowDataPacket } from 'mysql2/promise';
import type { MysqlReportStore } from './mysql-report-store';

export class InvalidUploadChunk extends Error {}

/** Staging is shared across instances/restarts and never writes server-side files. */
export async function saveUploadChunk(
  store: MysqlReportStore,
  chunk: ReportChunk,
  authentication?: MonitorAuthentication
) {
  if (await store.hash(chunk.id)) return { id: chunk.id, complete: true, nextIndex: chunk.total };
  const bytes = Buffer.from(chunk.data, 'base64');
  if (
    bytes.length >
      Math.min(
        chunk.chunkBytes ?? REPORT_CHUNK_BYTES,
        MAX_REPORT_BYTES - chunk.index * (chunk.chunkBytes ?? REPORT_CHUNK_BYTES)
      ) ||
    bytes.toString('base64') !== chunk.data
  )
    throw new InvalidUploadChunk('Invalid chunk bytes');
  const result = await store.connection(async connection => {
    const [size] = await store.query<RowDataPacket[]>(
      connection,
      'SELECT COUNT(DISTINCT upload_id) AS total FROM monitor_upload_chunks'
    );
    // Allow existing uploads to complete even when admission of new uploads is capped.
    const [existing] = await store.query<RowDataPacket[]>(
      connection,
      'SELECT 1 AS present FROM monitor_upload_chunks WHERE upload_id=? LIMIT 1',
      [chunk.uploadId]
    );
    if (Number(size?.total) >= 32 && !existing) throw new Error('Monitor upload staging is full');
    await store.query(
      connection,
      'INSERT IGNORE INTO monitor_upload_chunks (upload_id,chunk_index,report_id,total_chunks,chunk_data,expires_at_ms) VALUES (?,?,?,?,?,?)',
      [chunk.uploadId, chunk.index, chunk.id, chunk.total, bytes, Date.now() + 86400000]
    );
    const [saved] = await store.query<RowDataPacket[]>(
      connection,
      'SELECT chunk_data FROM monitor_upload_chunks WHERE upload_id=? AND chunk_index=?',
      [chunk.uploadId, chunk.index]
    );
    if (!saved || !bytes.equals(saved.chunk_data)) throw new InvalidUploadChunk('Conflicting chunk data');
    const rows = await store.query<RowDataPacket[]>(
      connection,
      'SELECT chunk_index,report_id,total_chunks,expires_at_ms FROM monitor_upload_chunks WHERE upload_id=? ORDER BY chunk_index',
      [chunk.uploadId]
    );
    if (rows.some(row => row.report_id !== chunk.id || row.total_chunks !== chunk.total))
      throw new InvalidUploadChunk('Conflicting upload metadata');
    if (rows.some(row => Number(row.expires_at_ms) <= Date.now())) {
      await store.query(connection, 'DELETE FROM monitor_upload_chunks WHERE upload_id=?', [chunk.uploadId]);
      return { nextIndex: 0 };
    }
    const missing = Array.from({ length: chunk.total }, (_, index) => index).find(
      index => !rows.some(row => row.chunk_index === index)
    );
    if (missing !== undefined) return { nextIndex: missing };
    const parts = await store.query<RowDataPacket[]>(
      connection,
      'SELECT chunk_data FROM monitor_upload_chunks WHERE upload_id=? ORDER BY chunk_index',
      [chunk.uploadId]
    );
    const data = Buffer.concat(parts.map(row => row.chunk_data as Buffer));
    if (data.length > MAX_REPORT_BYTES) throw new InvalidUploadChunk('Assembled report too large');
    let value: unknown;
    try {
      value = JSON.parse(data.toString('utf8'));
    } catch {
      throw new InvalidUploadChunk('Invalid assembled JSON');
    }
    const parsed = reportSchema.safeParse(value);
    if (
      !parsed.success ||
      parsed.data.id !== chunk.id ||
      parsed.data.context.authentication ||
      (parsed.data.kind === 'error' && parsed.data.error.kind === 'next-server')
    )
      throw new InvalidUploadChunk('Invalid assembled report');
    return { report: parsed.data, nextIndex: chunk.total };
  });
  if (!('report' in result) || !result.report) return { id: chunk.id, complete: false, nextIndex: result.nextIndex };
  result.report.context.authentication = authentication;
  await store.save(result.report);
  await store.connection(connection =>
    store.query(connection, 'DELETE FROM monitor_upload_chunks WHERE upload_id=?', [chunk.uploadId])
  );
  return { id: chunk.id, complete: true, nextIndex: chunk.total };
}
