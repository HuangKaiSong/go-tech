import type { MonitorAuthentication, MonitorReport, ReportChunk, ReportSummary } from '@go-tech/monitor-contract';
export interface ListFilter {
  cursor?: string;
  kind?: MonitorReport['kind'];
  limit: number;
  path?: string;
  sessionId?: string;
}

export function summarize(report: MonitorReport, receivedAt: number): ReportSummary {
  const { authentication, ...context } = report.context;
  const publicAuth = authentication
    ? { status: authentication.status, userId: authentication.userId, username: authentication.username }
    : undefined;
  const safe = { ...report, context: { ...context, authentication: publicAuth } };
  if (safe.kind === 'performance') return { ...safe, receivedAt, replayEventCount: 0 };
  const { replay, ...metadata } = safe;
  return { ...metadata, receivedAt, replayEventCount: replay.events.length };
}

export interface StoredReport {
  receivedAt: number;
  report: MonitorReport;
}
export interface SaveResult {
  duplicate: boolean;
  id: string;
}
export interface ReportPage {
  items: ReportSummary[];
  nextCursor: string | null;
}
export interface MonitorReportStore {
  close(): Promise<void>;
  getStored(id: string): Promise<StoredReport | null>;
  initialize(): Promise<void>;
  list(filter: ListFilter): Promise<ReportPage>;
  metrics?(): { failures: number; maxQueryMs: number; queries: number; totalQueryMs: number };
  prune(): Promise<void>;
  save(report: MonitorReport): Promise<SaveResult>;
  saveChunk?(
    chunk: ReportChunk,
    authentication?: MonitorAuthentication
  ): Promise<{ complete: boolean; id: string; nextIndex: number }>;
}
