import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger
} from '@go-tech-frontend/ui';
import { type ReportSummary, reportIdSchema } from '@go-tech/monitor-contract';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMonitorReports } from './monitor-api';
import { formatMonitorTime } from './monitor-context';
import { metricNames, metricValue, summarizeMetrics } from './monitor-metric-model';
import { MetricCell } from './monitor-metrics';

export default function MonitorListPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'performance' ? 'performance' : 'error';
  const path = params.get('path') ?? '';
  const sessionId = params.get('sessionId') ?? '';
  const reports = useInfiniteQuery({
    queryKey: ['browser-monitor', 'reports', view, path, sessionId],
    initialPageParam: '',
    queryFn: ({ pageParam, signal }) => {
      const search = new URLSearchParams({ kind: view, limit: '50' });
      if (path) search.set('path', path);
      if (sessionId) search.set('sessionId', sessionId);
      if (pageParam) search.set('cursor', pageParam);
      return getMonitorReports(search, signal);
    },
    getNextPageParam: page => page.nextCursor ?? undefined,
    retry: false
  });
  const items = reports.data?.pages.flatMap(page => page.items) ?? [];

  useEffect(() => {
    if (!params.has('view') && !path && !sessionId && reports.data?.pages[0].items.length === 0) {
      setParams({ view: 'performance' }, { replace: true });
    }
  }, [params, path, sessionId, reports.data, setParams]);

  const changeView = (next: string) => {
    if (next !== 'error' && next !== 'performance') return;
    const updated = new URLSearchParams(params);
    updated.set('view', next);
    setParams(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">網頁監控</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            reports.refetch();
          }}
          disabled={reports.isFetching}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">查看 web-h5 的錯誤現場、操作回放和頁面性能。</p>
      <Tabs value={view} onValueChange={changeView}>
        <TabsList>
          <TabsTrigger value="error">錯誤記錄</TabsTrigger>
          <TabsTrigger value="performance">性能指標</TabsTrigger>
        </TabsList>
      </Tabs>
      <FilterForm
        key={`${path}:${sessionId}`}
        path={path}
        sessionId={sessionId}
        onApply={(nextPath, nextSession) => {
          const updated = new URLSearchParams({ view });
          if (nextPath) updated.set('path', nextPath);
          if (nextSession) updated.set('sessionId', nextSession);
          setParams(updated);
        }}
      />
      {view === 'performance' && items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            已載入記錄的 p75 · 每次頁面訪問只計最新測量，載入更多可擴大樣本。
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {summarizeMetrics(items).map(metric => (
              <div key={metric.name} className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">{metric.name}</div>
                <div className="mt-2 text-xl font-semibold">
                  {metric.value === undefined ? '—' : metricValue({ name: metric.name, value: metric.value })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{metric.samples} 個訪問樣本</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {reports.isError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p>{reports.error.message}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              reports.refetch();
            }}
          >
            重試
          </Button>
        </div>
      )}
      <MonitorResults
        pending={reports.isPending}
        failed={reports.isError}
        items={items}
        view={view}
        search={params.toString()}
        onViewChange={changeView}
      />
      {reports.hasNextPage && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              reports.fetchNextPage();
            }}
            disabled={reports.isFetchingNextPage}
          >
            {reports.isFetchingNextPage ? '載入中…' : '載入更多'}
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterForm({
  onApply,
  path,
  sessionId
}: {
  onApply: (path: string, session: string) => void;
  path: string;
  sessionId: string;
}) {
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextPath = String(data.get('path') ?? '').trim();
    const nextSession = String(data.get('sessionId') ?? '').trim();
    if (nextPath && (!nextPath.startsWith('/') || nextPath.length > 1000 || /[?#]/.test(nextPath))) {
      setError('頁面路徑須以 / 開頭，不含查詢參數');
      return;
    }
    if (nextSession && !reportIdSchema.safeParse(nextSession).success) {
      setError('請輸入有效的會話 ID');
      return;
    }
    setError('');
    onApply(nextPath, nextSession);
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-60 flex-1 space-y-1 text-sm">
          頁面路徑
          <Input name="path" defaultValue={path} placeholder="例如 /account/login" />
        </label>
        <label className="min-w-60 flex-1 space-y-1 text-sm">
          會話 ID
          <Input name="sessionId" defaultValue={sessionId} placeholder="按會話篩選" />
        </label>
        <Button type="submit" variant="outline">
          篩選
        </Button>
        <Button type="button" variant="ghost" onClick={() => onApply('', '')}>
          重設
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

function MonitorResults({
  failed,
  items,
  onViewChange,
  pending,
  search,
  view
}: {
  failed: boolean;
  items: ReportSummary[];
  onViewChange: (value: string) => void;
  pending: boolean;
  search: string;
  view: 'error' | 'performance';
}) {
  if (pending)
    return (
      <p role="status" className="py-12 text-center text-muted-foreground">
        正在載入監控記錄…
      </p>
    );
  if (failed) return null;
  if (!items.length)
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p>{view === 'error' ? '暫無符合條件的錯誤記錄' : '暫無符合條件的性能記錄'}</p>
        <p className="mt-2 text-sm text-muted-foreground">開啟 H5 監控後，訪問頁面約十五秒再刷新。</p>
        {view === 'error' && (
          <Button className="mt-4" variant="outline" onClick={() => onViewChange('performance')}>
            查看性能指標
          </Button>
        )}
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>發生 / 接收時間（UTC+8）</TableHead>
            <TableHead>頁面</TableHead>
            {view === 'error' ? (
              <>
                <TableHead>錯誤</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>回放</TableHead>
              </>
            ) : (
              <>
                {metricNames.map(name => (
                  <TableHead key={name}>{name}</TableHead>
                ))}
                <TableHead>頁面狀態</TableHead>
              </>
            )}
            <TableHead>版本</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap">
                <div>{formatMonitorTime(item.timestamp)}</div>
                <div className="text-xs text-muted-foreground">接收：{formatMonitorTime(item.receivedAt)}</div>
              </TableCell>
              <TableCell className="max-w-60 break-all">{item.context.path}</TableCell>
              {item.kind === 'error' ? (
                <>
                  <TableCell className="max-w-80 break-words">{item.error.message}</TableCell>
                  <TableCell>{item.error.kind}</TableCell>
                  <TableCell>{replayLabel(item)}</TableCell>
                </>
              ) : (
                <>
                  {metricNames.map(name => (
                    <TableCell key={name} className="whitespace-nowrap">
                      <MetricCell metric={item.metrics.find(metric => metric.name === name)} />
                    </TableCell>
                  ))}
                  <TableCell>{item.hasError ? '有錯誤' : '無錯誤'}</TableCell>
                </>
              )}
              <TableCell>{item.context.release}</TableCell>
              <TableCell>
                <Link
                  to={`/monitor/${item.id}${search ? `?${search}` : ''}`}
                  className="whitespace-nowrap text-primary underline underline-offset-4"
                >
                  {item.kind === 'error' && item.error.kind !== 'next-server' ? '查看回放' : '查看詳情'}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function replayLabel(item: ReportSummary) {
  if (item.kind === 'error' && item.error.kind === 'next-server') return '伺服器錯誤，無回放';
  return item.replayEventCount ? `${item.replayEventCount} 個事件` : '無回放';
}
