import {
  MAX_REPORT_BYTES,
  MAX_REPORT_CHUNK_BYTES,
  type MonitorReport,
  REPORT_CHUNK_BYTES,
  type ReportChunk
} from '@go-tech/monitor-contract';
import { uploadReportChunks } from './chunk-upload';
import { type ReportDeliveryContext, ReportDeliveryError } from './report-queue';

export interface UploadNetworkState {
  downlink?: number;
  effectiveType?: string;
  hidden?: boolean;
  rtt?: number;
}
export interface MonitorUploadAck {
  complete?: boolean;
  id: string;
  nextIndex?: number;
}
export interface MonitorUploadOptions {
  chunk: boolean;
  keepalive: boolean;
  recovered: boolean;
}

function networkState(): UploadNetworkState {
  const connection: unknown = Reflect.get(navigator, 'connection');
  const state: UploadNetworkState = { hidden: document.visibilityState === 'hidden' };
  if (typeof connection !== 'object' || connection === null) return state;
  if ('downlink' in connection && typeof connection.downlink === 'number') state.downlink = connection.downlink;
  if ('effectiveType' in connection && typeof connection.effectiveType === 'string')
    state.effectiveType = connection.effectiveType;
  if ('rtt' in connection && typeof connection.rtt === 'number') state.rtt = connection.rtt;
  return state;
}
function estimatedRate(state: UploadNetworkState) {
  // Network Information reports download estimates, not measured upload bandwidth.
  // Use a conservative prior; real successful requests replace this estimate.
  if (state.effectiveType === 'slow-2g' || state.effectiveType === '2g') return 4 * 1024;
  if (state.effectiveType === '3g') return 24 * 1024;
  if (state.downlink && Number.isFinite(state.downlink) && state.downlink > 0)
    return ((state.downlink * 1000000) / 8) * 0.2;
  return undefined;
}
function canAdapt(error: unknown) {
  return error instanceof TypeError || (error instanceof ReportDeliveryError && error.adaptSize);
}

/** Prefer one request; choose resumable boundaries only when the estimated transfer would be slow. */
export function createAdaptiveReportTransport(
  send: (value: MonitorReport | ReportChunk, options: MonitorUploadOptions) => Promise<MonitorUploadAck>,
  state: () => UploadNetworkState = networkState
) {
  let observed: { at: number; rate: number; signature: string } | undefined;
  return async (report: MonitorReport, delivery: ReportDeliveryContext) => {
    const bytes = new TextEncoder().encode(JSON.stringify(report)).length;
    const network = state();
    const signature = JSON.stringify([network.effectiveType, network.downlink, network.rtt]);
    const rate =
      observed && observed.signature === signature && Date.now() - observed.at < 120000
        ? observed.rate
        : estimatedRate(network);
    const wholeBudget = network.hidden
      ? 48000
      : Math.min(MAX_REPORT_BYTES, Math.max(32000, (rate ?? MAX_REPORT_BYTES) * 8));
    const chunkBudget = Math.max(
      REPORT_CHUNK_BYTES,
      Math.min(MAX_REPORT_CHUNK_BYTES, Math.floor(((rate ?? 64 * 1024) * 4) / 1024) * 1024)
    );
    const { progress } = delivery;
    async function measuredSend(value: MonitorReport | ReportChunk, chunk: boolean) {
      const size = new TextEncoder().encode(JSON.stringify(value)).length;
      const started = performance.now();
      const ack = await send(value, {
        chunk,
        keepalive: size <= 48000,
        recovered: delivery.recovered || Date.now() - report.timestamp > 60000
      });
      if (ack.id !== report.id) throw new Error('Invalid monitor acknowledgement');
      // Include server/RTT cost and base64 overhead, intentionally biasing toward safer sizes.
      const elapsed = Math.max(100, performance.now() - started);
      const current = (chunk ? size * 0.75 : size) / (elapsed / 1000);
      const previous = observed?.signature === signature ? observed.rate : current;
      if (size >= 16384) observed = { at: Date.now(), rate: previous * 0.7 + current * 0.3, signature };
      return ack;
    }
    if (!progress.uploadId && !progress.forceChunks && bytes <= wholeBudget) {
      try {
        await measuredSend(report, false);
        return;
      } catch (error) {
        // Service outages/rate limits must not turn into a burst of chunk requests.
        if (!canAdapt(error)) throw error;
        progress.forceChunks = true;
        progress.chunkBytes = Math.min(chunkBudget, 64 * 1024);
        await delivery.checkpoint();
        if (navigator.onLine === false) throw error;
      }
    }
    if (!progress.uploadId && !progress.chunkBytes) progress.chunkBytes = network.hidden ? 32 * 1024 : chunkBudget;
    try {
      await uploadReportChunks(report, progress, {
        checkpoint: delivery.checkpoint,
        send: async chunk => {
          const ack = await measuredSend(chunk, true);
          if (typeof ack.complete !== 'boolean' || typeof ack.nextIndex !== 'number')
            throw new Error('Invalid monitor chunk acknowledgement');
          return { complete: ack.complete, nextIndex: ack.nextIndex };
        }
      });
    } catch (error) {
      const size = progress.chunkBytes ?? REPORT_CHUNK_BYTES;
      if (canAdapt(error) && size > REPORT_CHUNK_BYTES) {
        // A fresh upload ID is required when boundaries change; never mix old/new fragments.
        progress.chunkBytes = Math.max(REPORT_CHUNK_BYTES, Math.floor(size / 2048) * 1024);
        progress.uploadId = '';
        progress.index = 0;
        progress.forceChunks = true;
        await delivery.checkpoint();
      }
      throw error;
    }
  };
}
