import { Button, Input } from '@go-tech-frontend/ui';
import type { ManualArticle, ManualRecord } from '@go-tech/manual-content/model';
import { useState } from 'react';
import { manualRows, stateLabel } from './selection';
import type { ManualController } from './use-manual';

/** 后台筛选基于草稿字段，已发布记录另可按是否存在待发布修改筛选。 */
function filterGuides(
  rows: ManualRecord<ManualArticle>[],
  { category, query, status }: { category: string; query: string; status: string }
) {
  return rows.filter(row => {
    if (category && row.draft.categoryId !== Number(category)) return false;
    if (status === 'published' && !row.published) return false;
    if (status === 'draft' && row.published) return false;
    if (status === 'changed' && (!row.published || JSON.stringify(row.published) === JSON.stringify(row.draft)))
      return false;
    return (row.draft.title + row.draft.summary + row.draft.slug).includes(query.trim());
  });
}
/** 按管理种类展示可编辑记录，并维持主题、发布状态和关键词筛选条件。 */
export function ContentList({ controller }: { controller: ManualController }) {
  const { busy, choose, data, selection, tab } = controller;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  if (!data) return null;
  let rows = manualRows(data, tab);
  if (tab === 'article') rows = filterGuides(data.articles, { query, category, status });
  rows = rows.toSorted(
    (a, b) =>
      ('sortOrder' in a.draft ? a.draft.sortOrder : 0) - ('sortOrder' in b.draft ? b.draft.sortOrder : 0) || a.id - b.id
  );
  return (
    <>
      <div className="shrink-0 space-y-3 border-b border-border p-3">
        {tab === 'article' && (
          <>
            <Input
              aria-label="搜尋指南"
              placeholder="搜尋標題、摘要或 URL"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                aria-label="篩選主題"
                className="w-full border rounded-md p-2 bg-background"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">全部主題</option>
                {data.categories.map(row => (
                  <option key={row.id} value={row.id}>
                    {row.draft.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="篩選狀態"
                className="w-full border rounded-md p-2 bg-background"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">全部狀態</option>
                <option value="published">已發佈</option>
                <option value="draft">未發佈</option>
                <option value="changed">有未發佈修改</option>
              </select>
            </div>
          </>
        )}
        {tab !== 'settings' && (
          <Button disabled={busy || (tab === 'article' && !data.categories.length)} onClick={() => choose(tab)}>
            新增{tab === 'article' ? '指南' : '主題'}
          </Button>
        )}
      </div>
      {/* 筛选条件不随列表滚动，长列表只占用工作区剩余高度。 */}
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3"
        aria-label="內容項目"
        role="region"
        tabIndex={0}
      >
        {rows.map(row => (
          <button
            type="button"
            key={row.id}
            disabled={busy}
            aria-pressed={selection?.record?.id === row.id && selection.kind === tab}
            onClick={() => choose(tab, row)}
            className={`block w-full p-4 text-left border rounded-lg ${selection?.record?.id === row.id && selection.kind === tab ? 'border-primary' : 'border-border'}`}
          >
            <span className="font-semibold block">{'name' in row.draft ? row.draft.name : row.draft.title}</span>
            <span className="text-xs text-muted-foreground">{stateLabel(row)}</span>
          </button>
        ))}
        {!rows.length && <p className="text-muted-foreground">沒有符合條件的內容；新增指南前請先建立主題。</p>}
      </div>
    </>
  );
}
