import { Button } from '@go-tech-frontend/ui';
import { type ErrorReport, type MonitorContext, type MonitorReport, reportIdSchema } from '@go-tech/monitor-contract';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getMonitorReport } from './monitor-api';
import { authenticationLabels, deviceTypeLabel, formatMonitorTime, timeSourceLabel } from './monitor-context';
import { MetricCards } from './monitor-metrics';
import { MonitorReplay } from './monitor-replay';

const replayReasons = {
  'not-ready': '錯誤發生時錄製尚未就緒，沒有可播放的快照。',
  'recording-failed': '當時錄製失敗，錯誤詳情仍可查看。',
  'buffer-limit': '頁面快照超出錄製容量，錯誤詳情仍可查看。',
  'server-error': '此錯誤發生於 Next.js 伺服器，不提供瀏覽器回放。'
};

function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MonitorDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const validId = reportIdSchema.safeParse(id).success;
  const query = useQuery({
    queryKey: ['browser-monitor', 'report', id],
    queryFn: ({ signal }) => getMonitorReport(id, signal),
    enabled: validId,
    retry: false
  });
  const report = query.data;
  let content: ReactNode;
  if (!validId) content = <p role="alert">無效的監控記錄 ID</p>;
  else if (query.isPending) content = <p role="status">正在載入監控詳情…</p>;
  else if (query.isError)
    content = (
      <div role="alert" className="rounded-lg border border-destructive/30 p-4">
        <p>{query.error.message}</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            query.refetch();
          }}
        >
          重試
        </Button>
      </div>
    );
  else if (report) content = <ReportContent report={report} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/monitor${location.search}`} className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" />
          返回監控列表
        </Link>
        <Button
          variant="outline"
          disabled={!validId || query.isFetching}
          onClick={() => {
            query.refetch();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      {content}
    </div>
  );
}

function Context({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-all">{value}</dd>
    </div>
  );
}
function Stack({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-4 text-xs">{value}</pre>
    </section>
  );
}

type DetailReport = MonitorReport & { receivedAt?: number };

export function ReportContent({ report }: { report: DetailReport }) {
  return (
    <>
      <ReportHeader report={report} />
      <MetricCards metrics={report.metrics} />
      {report.kind === 'error' && <ReplaySection report={report} />}
      <ContextSection report={report} />
      <AuthenticationDetails context={report.context} />
      {report.kind === 'error' && <ErrorDetails report={report} />}
    </>
  );
}

function isServerError(report: MonitorReport) {
  return report.kind === 'error' && report.error.kind === 'next-server';
}

function ReportHeader({ report }: { report: DetailReport }) {
  const serverError = isServerError(report);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="break-words text-2xl font-bold">
          {report.kind === 'error' ? report.error.message : '頁面性能詳情'}
        </h1>
        <p className="mt-2 break-all text-sm text-muted-foreground">
          {report.context.path} · {formatMonitorTime(report.timestamp)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => download(report, `${report.id}.json`)}>
          <Download className="mr-2 h-4 w-4" />
          下載記錄
        </Button>
        {report.kind === 'error' && !serverError && report.replay.events.length > 0 && (
          <Button variant="outline" onClick={() => download(report.replay.events, `${report.id}-rrweb.json`)}>
            下載回放 JSON
          </Button>
        )}
      </div>
    </div>
  );
}

function ReplaySection({ report }: { report: ErrorReport }) {
  const serverError = isServerError(report);
  let content: ReactNode = (
    <p className="text-sm text-muted-foreground">{replayReasons[report.replay.unavailableReason ?? 'not-ready']}</p>
  );
  if (serverError) content = <p className="text-sm text-muted-foreground">{replayReasons['server-error']}</p>;
  else if (report.replay.events.length)
    content = <MonitorReplay key={report.id} events={report.replay.events} errorTimestamp={report.timestamp} />;
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 text-lg font-semibold">{serverError ? '伺服器錯誤' : '錯誤現場回放'}</h2>
      {content}
    </section>
  );
}

function ContextSection({ report }: { report: DetailReport }) {
  const serverError = isServerError(report);
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 text-lg font-semibold">記錄上下文</h2>
      <dl className="grid gap-4 text-sm md:grid-cols-2">
        <Context label="應用" value={report.context.app} />
        <Context label="發布版本" value={report.context.release} />
        <Context label="會話 ID" value={report.context.sessionId} />
        <Context label="頁面訪問 ID" value={report.context.pageId} />
        <Context label="瀏覽器" value={report.context.userAgent} />
        <Context label="發生時間" value={formatMonitorTime(report.timestamp)} />
        {report.receivedAt !== undefined && (
          <Context label="監控接收時間" value={formatMonitorTime(report.receivedAt)} />
        )}
        <Context label="時間來源" value={timeSourceLabel(report.timeSource)} />
        <DeviceContext context={report.context} />
        <AuthenticationContext context={report.context} />
        {report.context.request && (
          <Context
            label="伺服器請求"
            value={`${report.context.request.method} ${report.context.request.routePath ?? report.context.path} · ${report.context.request.routeType ?? '—'}`}
          />
        )}
        <Context
          label="語言 / 視窗"
          value={`${report.context.language} · ${serverError ? '伺服器請求無視窗尺寸' : `${report.context.viewport.width} × ${report.context.viewport.height}`}`}
        />
        {report.kind === 'error' ? (
          <>
            <Context label="錯誤類型" value={report.error.kind} />
            <Context
              label="HTTP / 業務碼"
              value={`${report.error.status ?? '—'} / ${report.error.businessCode ?? '—'}`}
            />
            {report.error.digest && <Context label="錯誤識別碼" value={report.error.digest} />}
          </>
        ) : (
          <Context label="頁面狀態" value={report.hasError ? '此次頁面訪問發生過錯誤' : '此次頁面訪問未發生錯誤'} />
        )}
      </dl>
    </section>
  );
}

function DeviceContext({ context }: { context: MonitorContext }) {
  return (
    <>
      <Context label="設備平台" value={context.device?.platform || '未提供（可參考瀏覽器資訊）'} />
      <Context label="設備類型" value={deviceTypeLabel(context.device?.mobile)} />
      <Context label="設備時區" value={context.device?.timezone ?? '伺服器請求未提供'} />
    </>
  );
}

function AuthenticationContext({ context }: { context: MonitorContext }) {
  const authentication = context.authentication;
  return (
    <>
      <Context label="認證狀態" value={authentication ? authenticationLabels[authentication.status] : '舊記錄未採集'} />
      <Context label="登入用戶 ID" value={authentication?.userId ?? '—'} />
      <Context label="登入用戶名" value={authentication?.username ?? '—'} />
    </>
  );
}

function AuthenticationDetails({ context }: { context: MonitorContext }) {
  const authentication = context.authentication;
  if (!authentication?.token && !authentication?.cookie) return null;
  return (
    <details className="rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer font-semibold">登入認證詳情（Token / Cookie）</summary>
      <dl className="mt-4 space-y-4 text-sm">
        <Context label="Token" value={authentication.token ?? '—'} />
        <Context label="認證 Cookie" value={authentication.cookie ?? '—'} />
      </dl>
    </details>
  );
}

function ErrorDetails({ report }: { report: ErrorReport }) {
  const serverError = isServerError(report);
  return (
    <>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">操作與請求時間線</h2>
        {report.breadcrumbs.length ? (
          <ol className="space-y-3">
            {report.breadcrumbs.map((breadcrumb, index) => (
              <li key={`${breadcrumb.timestamp}-${index}`} className="flex flex-wrap gap-3 text-sm">
                <time className="text-muted-foreground">{formatMonitorTime(breadcrumb.timestamp)}</time>
                <span>{breadcrumb.category === 'navigation' ? '導航' : '請求'}</span>
                <span className="break-all">{breadcrumb.message}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">沒有額外的操作或請求記錄</p>
        )}
      </section>
      {report.error.stack && (
        <Stack title={serverError ? '伺服器堆棧' : 'JavaScript 堆棧'} value={report.error.stack} />
      )}
      {report.error.componentStack && <Stack title="React 組件堆棧" value={report.error.componentStack} />}
    </>
  );
}
