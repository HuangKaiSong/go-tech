import { Button } from '@go-tech-frontend/ui';
import { BookOpen } from 'lucide-react';
import { ContentList } from './content-list';
import { EditPanel } from './edit-panel';
import { useManual } from './use-manual';

/** 后台手册管理入口，统一组合内容列表、编辑面板和未保存修改确认。 */
export default function ManualManagement() {
  const controller = useManual();
  const { busy, changeTab, confirmation, data, error, reload, tab } = controller;
  if (!data)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">操作手冊</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Button onClick={reload} disabled={busy}>
              重新載入
            </Button>
          </>
        ) : (
          <p role="status">載入中…</p>
        )}
      </div>
    );
  return (
    <div className="space-y-6">
      {confirmation}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen />
          操作手冊
        </h1>
        <Button variant="outline" onClick={reload} disabled={busy}>
          重新載入
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2" aria-label="管理內容">
        {(
          [
            ['article', '指南'],
            ['category', '主題'],
            ['settings', '首頁設定']
          ] as const
        ).map(([kind, label]) => (
          <Button
            key={kind}
            variant={tab === kind ? 'default' : 'outline'}
            disabled={busy}
            onClick={() => changeTab(kind)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="grid xl:grid-cols-[minmax(260px,1fr)_minmax(0,3fr)] gap-6">
        <section className="space-y-3" aria-label="內容列表">
          <ContentList controller={controller} />
        </section>
        <section className="border border-border bg-card rounded-xl p-5 min-w-0 space-y-5" aria-label="內容編輯">
          <EditPanel controller={controller} />
        </section>
      </div>
    </div>
  );
}
