import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@go-tech-frontend/ui';
import { type BlogKind, publicationStates } from '@go-tech/blog-content/model';
import { Newspaper } from 'lucide-react';
import { useState } from 'react';
import { BlogForm } from './forms';
import { BlogPreview } from './preview';
import { type BlogController, blogRows, useBlog } from './use-blog';
const names: Record<BlogKind, string> = { article: '文章', category: '分類', settings: '頁面設定' };
const states = { draft: '草稿', published: '已發佈', offline: '已下架' };
export default function BlogManagement() {
  const c = useBlog();
  const [search, setSearch] = useState('');
  const [state, setState] = useState('all');
  if (!c.data)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">博客管理</h1>
        {c.error ? (
          <>
            <p role="alert">{c.error}</p>
            <Button onClick={c.reload}>重新載入</Button>
          </>
        ) : (
          <p role="status">載入中…</p>
        )}
      </div>
    );
  const rows = blogRows(c.data, c.kind)
    .filter(
      row => (state === 'all' || row.publicationState === state) && JSON.stringify(row.draft).includes(search.trim())
    )
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {c.confirmation}
      <div className="flex flex-wrap justify-between gap-3 shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Newspaper />
          博客管理
        </h1>
        <Button variant="outline" disabled={c.busy} onClick={c.reload}>
          重新載入
        </Button>
      </div>
      <nav aria-label="博客管理內容" className="flex gap-2 shrink-0">
        {(['article', 'category', 'settings'] as const).map(kind => (
          <Button
            key={kind}
            disabled={c.busy}
            variant={c.kind === kind ? 'default' : 'outline'}
            onClick={() => {
              c.changeKind(kind);
              setSearch('');
              setState('all');
            }}
          >
            {names[kind]}
          </Button>
        ))}
      </nav>
      {c.error && (
        <p role="alert" className="text-destructive">
          {c.error}
        </p>
      )}
      <div className="grid min-h-0 flex-1 grid-rows-[20rem_auto] gap-4 overflow-y-auto lg:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)] lg:grid-rows-1 lg:overflow-hidden">
        <section aria-label="博客內容列表" className="min-h-0 flex flex-col rounded-xl border bg-card overflow-hidden">
          <div className="p-4 space-y-3 border-b shrink-0">
            {c.kind !== 'settings' && (
              <Button disabled={c.busy} className="w-full" onClick={() => c.choose(c.kind)}>
                新增{names[c.kind]}
              </Button>
            )}
            <Input
              aria-label="搜尋管理內容"
              placeholder="搜尋內容"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select value={state} onValueChange={setState}>
              <SelectTrigger aria-label="發佈狀態" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                {publicationStates.map(item => (
                  <SelectItem key={item} value={item}>
                    {states[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ul className="overflow-y-auto min-h-0 divide-y">
            {rows.map(row => (
              <li key={row.id}>
                <button
                  disabled={c.busy}
                  className={`w-full text-left p-4 hover:bg-muted ${c.selected?.id === row.id ? 'bg-muted' : ''}`}
                  onClick={() => c.choose(c.kind, row)}
                >
                  <span className="block font-semibold">{'title' in row.draft ? row.draft.title : row.draft.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {states[row.publicationState]}
                    {row.published && row.version !== row.publishedVersion ? ' · 有未發佈修改' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!rows.length && <p className="p-4 text-muted-foreground">沒有符合的內容</p>}
        </section>
        <BlogEditor controller={c} />
      </div>
    </div>
  );
}

function BlogEditor({ controller: c }: { controller: BlogController }) {
  const disabled = c.busy || c.uploads > 0;
  let notice = '草稿已儲存';
  if (c.uploads) notice = '請先完成或取消圖片上傳';
  else if (c.dirty) notice = '有未儲存修改';
  return (
    <section aria-label="博客內容編輯" className="min-w-0 rounded-xl border bg-card lg:min-h-0 lg:overflow-y-auto">
      {!c.draft ? (
        <p className="p-6 text-muted-foreground">請選擇或新增內容</p>
      ) : (
        <>
          <div className="sticky top-0 z-10 flex flex-wrap gap-2 p-4 border-b bg-card">
            <Button disabled={disabled} onClick={() => c.perform(c.selected ? 'save' : 'create')}>
              儲存草稿
            </Button>
            <Button
              variant="outline"
              disabled={disabled || c.dirty || !c.selected}
              onClick={() => (c.preview ? c.setPreview(false) : c.showPreview())}
            >
              {c.preview ? '返回編輯' : '預覽'}
            </Button>
            <Button disabled={disabled || c.dirty || !c.selected} onClick={() => c.perform('publish')}>
              發佈
            </Button>
            {c.kind !== 'settings' && (
              <>
                <Button
                  variant="outline"
                  disabled={disabled || c.dirty || !c.selected?.published}
                  onClick={() => c.perform('unpublish')}
                >
                  下架
                </Button>
                <Button
                  variant="destructive"
                  disabled={disabled || !c.selected || Boolean(c.selected.published)}
                  onClick={() => c.perform('delete')}
                >
                  刪除
                </Button>
              </>
            )}
            <span role="status" className="self-center text-xs text-muted-foreground">
              {notice}
            </span>
          </div>
          <div className="p-5" key={`${c.kind}:${c.selected?.id ?? 'new'}:${c.preview}`}>
            {c.preview ? <BlogPreview draft={c.draft} /> : <BlogForm controller={c} />}
          </div>
        </>
      )}
    </section>
  );
}
