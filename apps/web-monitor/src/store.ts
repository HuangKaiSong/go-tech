import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
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
  if (report.kind === 'performance') return { ...report, receivedAt, replayEventCount: 0 };
  const { replay, ...metadata } = report;
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
  ) {}

  async initialize() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    for (const name of await readdir(this.directory)) {
      // oxlint-disable-next-line no-await-in-loop -- Loading one potentially large recording at a time bounds startup memory.
      await this.loadSummary(name);
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
      this.summaries.set(id, summarize(report, stored.receivedAt));
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
    return this.serialize(() => this.pruneFiles());
  }

  private async pruneFiles() {
    const ordered = [...this.summaries.values()].toSorted((a, b) => b.receivedAt - a.receivedAt);
    const expired = ordered.filter(
      (item, index) => index >= this.maxReports || item.receivedAt <= Date.now() - this.retentionMs
    );
    for (const item of expired) {
      // oxlint-disable-next-line no-await-in-loop -- Serialize disk deletion with the store's mutation queue.
      await unlink(join(this.directory, `${item.id}.json`)).catch(error => {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      });
      this.summaries.delete(item.id);
    }
  }
}
