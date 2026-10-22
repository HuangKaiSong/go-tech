import { Button } from '@go-tech-frontend/ui';
import { BookOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ContentList } from './content-list';
import { EditPanel } from './edit-panel';
import { useManual } from './use-manual';

/** 后台手册管理入口，统一组合内容列表、编辑面板和未保存修改确认。 */
export default function ManualManagement() {
  const controller = useManual();
  const { busy, changeTab, confirmation, data, error, reload, tab } = controller;
  const editPanelRef = useRef<HTMLElement>(null);
  const selectedKey = controller.selection
    ? `${controller.selection.kind}:${controller.selection.record?.id ?? 'new'}`
    : null;
  useEffect(() => {
    const panel = editPanelRef.current;
    if (!selectedKey || !panel) return;
    // 换篇时重置编辑区；窄屏自动定位到表单，避免选完列表后还需手动寻找正文。
    panel.scrollTop = 0;
    if (window.matchMedia('(max-width: 1023px)').matches) panel.scrollIntoView?.({ block: 'start' });
  }, [selectedKey]);
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
    <div className="flex h-full min-h-0 flex-col gap-4">
      {confirmation}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
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
      <div className="flex shrink-0 flex-wrap gap-2" aria-label="管理內容">
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
      {/* 窄屏在工作区内纵向滚动；宽屏让列表和编辑面板独立滚动，标题与导航始终保留。 */}
      <div
        role="region"
        aria-label="手冊內容"
        tabIndex={0}
        className="grid min-h-0 flex-1 grid-rows-[20rem_auto] content-start gap-4 overflow-y-auto overscroll-contain focus-visible:outline-primary lg:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)] lg:grid-rows-1 lg:content-stretch lg:overflow-hidden"
      >
        <section
          className="flex max-h-80 min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:max-h-none"
          aria-label="內容列表"
        >
          <ContentList controller={controller} />
        </section>
        <section
          className="min-w-0 rounded-xl border border-border bg-card lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
          ref={editPanelRef}
          aria-label="內容編輯"
        >
          <EditPanel controller={controller} />
        </section>
      </div>
    </div>
  );
}
