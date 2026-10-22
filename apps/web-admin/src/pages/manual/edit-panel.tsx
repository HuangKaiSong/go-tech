import { Button } from '@go-tech-frontend/ui';
import { ArticleForm, CategoryForm, SettingsForm } from './forms';
import { ManualPreview } from './preview';
import { manualTime, stateLabel } from './selection';
import type { ManualController } from './use-manual';

/** 根据内容种类选择表单；指南身份或版本变化时重建编辑器，防止串用上一篇正文。 */
function EditorForm({ controller }: { controller: ManualController }) {
  const { busy, data, selection, setSelection } = controller;
  if (!selection || !data) return null;
  switch (selection.kind) {
    case 'article':
      return (
        <ArticleForm
          key={`${selection.record?.id ?? 'new'}-${selection.record?.version ?? 0}`}
          value={selection.draft}
          categories={data.categories}
          locked={Boolean(selection.record?.lockedSlug)}
          disabled={busy}
          onChange={draft => setSelection({ ...selection, draft })}
        />
      );
    case 'category':
      return (
        <CategoryForm
          value={selection.draft}
          disabled={busy}
          onChange={draft => setSelection({ ...selection, draft })}
        />
      );
    default:
      return (
        <SettingsForm
          value={selection.draft}
          disabled={busy}
          onChange={draft => setSelection({ ...selection, draft })}
        />
      );
  }
}
/** 管理保存、预览、发布等操作按钮；未保存的内容必须先保存才能发布或预览。 */
export function EditPanel({ controller }: { controller: ManualController }) {
  const { busy, dirty, perform, preview, selection, setPreview, showPreview } = controller;
  if (!selection) return <p className="text-muted-foreground py-12 text-center">請選擇內容或新增項目</p>;
  let title = '新增內容';
  if (selection.record) title = '編輯內容';
  if (preview) title = '草稿預覽';
  return (
    <>
      {/* 操作栏位于内容滚动容器内，滚动长指南时仍可直接保存、预览和发布。 */}
      <div className="sticky top-0 z-10 space-y-3 rounded-t-xl border-b border-border bg-card p-4 lg:p-5">
        <div className="flex flex-wrap gap-2 items-center">
          <h2 className="font-bold text-xl mr-auto">{title}</h2>
          {dirty && <span className="text-sm text-primary">有未儲存修改</span>}
        </div>
        {selection.record && (
          <p className="text-sm text-muted-foreground">
            {stateLabel(selection.record)} · 版本 {selection.record.version} · 最近修改：
            {manualTime(selection.record.updatedAt)} · 管理員 {selection.record.updatedBy}
            {selection.record.publishedAt && ` · 發佈時間：${manualTime(selection.record.publishedAt)}`}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || preview} onClick={() => perform(selection.record ? 'save' : 'create')}>
            儲存草稿
          </Button>
          <Button
            variant="outline"
            disabled={busy || dirty || !selection.record}
            onClick={preview ? () => setPreview(false) : showPreview}
          >
            {preview ? '返回編輯' : '預覽已儲存草稿'}
          </Button>
          <Button disabled={busy || dirty || !selection.record} onClick={() => perform('publish')}>
            發佈
          </Button>
          {selection.kind !== 'settings' && (
            <>
              <Button
                variant="outline"
                disabled={busy || dirty || !selection.record?.published}
                onClick={() => perform('unpublish')}
              >
                下架
              </Button>
              <Button variant="destructive" disabled={busy || !selection.record} onClick={() => perform('delete')}>
                刪除
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-5 p-4 lg:p-5">
        {preview ? (
          <div className="bg-background rounded-xl p-6">
            <ManualPreview selection={selection} />
          </div>
        ) : (
          <EditorForm controller={controller} />
        )}
      </div>
    </>
  );
}
