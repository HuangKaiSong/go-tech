import { type MonitorReport, REPORT_CHUNK_BYTES, type ReportChunk } from '@go-tech/monitor-contract';
import { createIdentifier } from './identifier';

/** Progress is persisted before sending the next chunk; a lost final ACK safely retries. */
export async function uploadReportChunks(
  report: MonitorReport,
  progress: { index: number; uploadId: string },
  options: {
    checkpoint: () => Promise<void>;
    send: (chunk: ReportChunk) => Promise<{ complete: boolean; nextIndex: number }>;
  }
) {
  const bytes = new TextEncoder().encode(JSON.stringify(report));
  const total = Math.ceil(bytes.length / REPORT_CHUNK_BYTES);
  if (!progress.uploadId) {
    progress.uploadId = createIdentifier();
    await options.checkpoint();
  }
  for (let index = progress.index; index < total; index = progress.index) {
    const slice = bytes.subarray(index * REPORT_CHUNK_BYTES, (index + 1) * REPORT_CHUNK_BYTES);
    const data = btoa(String.fromCharCode(...slice));
    // oxlint-disable-next-line no-await-in-loop -- Only advance after the previous chunk is acknowledged.
    const result = await options.send({
      protocol: 'monitor-chunk-v1',
      id: report.id,
      uploadId: progress.uploadId,
      index,
      total,
      data
    });
    if (result.complete) return;
    if (
      !Number.isInteger(result.nextIndex) ||
      result.nextIndex < 0 ||
      result.nextIndex >= total ||
      result.nextIndex === index
    )
      throw new Error('Invalid monitor chunk acknowledgement');
    progress.index = result.nextIndex;
    // oxlint-disable-next-line no-await-in-loop -- Persist resumable progress before the next network request.
    await options.checkpoint();
  }
  throw new Error('Missing monitor commit acknowledgement');
}
