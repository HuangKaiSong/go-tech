import { randomUUID } from 'node:crypto';
import { mkdir, opendir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type MonitorReport, type ReportSummary, reportIdSchema, reportSchema } from '@go-tech/monitor-contract';

export interface ListFilter {
  cursor?: string;
  kind?: MonitorReport['kind'];
  limit: number;
  path?: string;
  sessionId?: string;
}

function summarize(report: MonitorReport, receivedAt: number): ReportSummary {
  const { authentication, ...context } = report.context;
  const publicAuth = authentication
    ? { status: authentication.status, userId: authentication.userId, username: authentication.username }
    : undefined;
  const safe = { ...report, context: { ...context, authentication: publicAuth } };
  if (safe.kind === 'performance') return { ...safe, receivedAt, replayEventCount: 0 };
  const { replay, ...metadata } = safe;
  return { ...metadata, receivedAt, replayEventCount: replay.events.length };
}

/** Single-process local JSON store; each report is published with an atomic rename. */
export class ReportStore {
  private readonly summaries = new Map<string, ReportSummary>();
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly directory: string,
    private readonly retentionMs: number,
    private readonly maxReports: number
  ) {
    if (!Number.isSafeInteger(maxReports) || maxReports < 1) throw new Error('Invalid maxReports');
    if (!Number.isSafeInteger(retentionMs) || retentionMs < 1) throw new Error('Invalid retentionMs');
  }

  async initialize() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    for await (const entry of await opendir(this.directory)) {
      if (entry.isFile()) {
        // oxlint-disable-next-line no-await-in-loop -- Loading one potentially large recording at a time bounds startup memory.
        const summary = await this.loadSummary(entry.name);
        if (summary) {
          this.summaries.set(summary.id, summary);
          if (this.summaries.size > this.maxReports || summary.receivedAt <= Date.now() - this.retentionMs) {
            // oxlint-disable-next-line no-await-in-loop -- Enforce the memory cap before reading the next file; avoid sorting below capacity.
            await this.pruneFiles();
          }
        }
      }
    }
    await this.prune();
  }

  private async loadSummary(name: string) {
    const id = name.replace(/\.json$/, '');
    if (!name.endsWith('.json') || !reportIdSchema.safeParse(id).success) return;
    try {
      const stored: unknown = JSON.parse(await readFile(join(this.directory, name), 'utf8'));
      if (typeof stored !== 'object' || stored === null || !('report' in stored) || !('receivedAt' in stored)) return;
      const report = reportSchema.parse(stored.report);
      if (report.id !== id || typeof stored.receivedAt !== 'number' || !Number.isFinite(stored.receivedAt)) return;
      return summarize(report, stored.receivedAt);
    } catch {
      /* Incomplete/corrupt files are not exposed as valid recordings. */
    }
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  save(report: MonitorReport) {
    return this.serialize(async () => {
      // Transport retries use the same report UUID and cannot overwrite a recording.
      const existing = this.summaries.get(report.id);
      if (existing) return { id: report.id, duplicate: true };
      const receivedAt = Date.now();
      const temporary = join(this.directory, `${report.id}.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify({ receivedAt, report }), { flag: 'wx', mode: 0o600 });
        await rename(temporary, join(this.directory, `${report.id}.json`));
      } finally {
        await unlink(temporary).catch(() => undefined);
      }
      this.summaries.set(report.id, summarize(report, receivedAt));
      await this.pruneFiles();
      return { id: report.id, duplicate: false };
    });
  }

  async get(id: string): Promise<MonitorReport | null> {
    if (!reportIdSchema.safeParse(id).success || !this.summaries.has(id)) return null;
    const summary = this.summaries.get(id);
    if (!summary || summary.receivedAt <= Date.now() - this.retentionMs) return null;
    try {
      const stored: unknown = JSON.parse(await readFile(join(this.directory, `${id}.json`), 'utf8'));
      if (typeof stored !== 'object' || stored === null || !('report' in stored)) return null;
      return reportSchema.parse(stored.report);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
      throw error;
    }
  }

  receivedAt(id: string) {
    return this.summaries.get(id)?.receivedAt;
  }

  list(filter: ListFilter) {
    const ordered = [...this.summaries.values()]
      .filter(item => item.receivedAt > Date.now() - this.retentionMs)
      .toSorted((a, b) => b.receivedAt - a.receivedAt || b.id.localeCompare(a.id));
    const after = filter.cursor ? ordered.findIndex(item => item.id === filter.cursor) + 1 : 0;
    if (filter.cursor && after === 0) return { items: [], nextCursor: null };
    const matching = ordered
      .slice(after)
      .filter(
        item =>
          (!filter.kind || item.kind === filter.kind) &&
          (!filter.sessionId || item.context.sessionId === filter.sessionId) &&
          (!filter.path || item.context.path === filter.path)
      );
    const items = matching.slice(0, filter.limit);
    return { items, nextCursor: matching.length > filter.limit ? (items.at(-1)?.id ?? null) : null };
  }

  prune() {
    return this.serialize(async () => {
      await this.pruneFiles();
      // Retry orphaned files from previous failed deletions without keeping an unbounded retry queue in memory.
      for await (const entry of await opendir(this.directory)) {
        if (entry.isFile()) {
          // oxlint-disable-next-line no-await-in-loop -- Keep disk cleanup serialized with writes and other deletions.
          await this.pruneOrphan(entry.name);
        }
      }
    });
  }

  private async pruneOrphan(name: string) {
    if (!name.endsWith('.json')) return;
    const id = name.slice(0, -5);
    if (!reportIdSchema.safeParse(id).success || this.summaries.has(id)) return;
    // Preserve corrupt/incompatible files, matching startup's existing ignore policy.
    if (await this.loadSummary(name)) await this.removeReportFile(id);
  }

  private async pruneFiles() {
    const ordered = [...this.summaries.values()].toSorted((a, b) => b.receivedAt - a.receivedAt);
    const expired = ordered.filter(
      (item, index) => index >= this.maxReports || item.receivedAt <= Date.now() - this.retentionMs
    );
    // Evict every discarded summary synchronously, even if the very first disk deletion fails.
    for (const item of expired) this.summaries.delete(item.id);
    for (const item of expired) {
      // oxlint-disable-next-line no-await-in-loop -- Serialize disk deletion with the store's mutation queue.
      await this.removeReportFile(item.id);
    }
  }

  private async removeReportFile(id: string) {
    await unlink(join(this.directory, `${id}.json`)).catch(error => {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    });
  }
}
