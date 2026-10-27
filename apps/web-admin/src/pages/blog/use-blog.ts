import { toast } from '@go-tech-frontend/ui';
import {
  type BlogAdminData,
  type BlogCommand,
  type BlogDraft,
  type BlogKind,
  type BlogRecord,
  defaultBlogSettings,
  draftSchemas
} from '@go-tech/blog-content/model';
import { emptyDocument } from '@go-tech/manual-content/model';
import { useEffect, useState } from 'react';
import { useContentConfirmation } from '../content/confirmation';
import { useUnsavedGuard } from '../content/use-unsaved-guard';
import { blogRequest } from './api';
export function blogRows(data: BlogAdminData, kind: BlogKind): BlogRecord[] {
  if (kind === 'article') return data.articles;
  if (kind === 'category') return data.categories;
  return data.settings;
}
function newDraft(kind: BlogKind, data: BlogAdminData | null): BlogDraft {
  if (kind === 'category') return { name: '', sortOrder: 0 };
  if (kind === 'settings') return defaultBlogSettings;
  return {
    title: '',
    slug: '',
    excerpt: '',
    categoryId: data?.categories[0]?.id ?? 0,
    cover: '',
    coverAlt: '',
    body: emptyDocument,
    tags: [],
    displayDate: new Date().toISOString().slice(0, 10),
    readMin: 3,
    sortOrder: 0,
    isFeatured: false
  };
}
const label = { article: '文章', category: '分類', settings: '頁面設定' };
export function useBlog() {
  const [data, setData] = useState<BlogAdminData | null>(null);
  const [kind, setKind] = useState<BlogKind>('article');
  const [selected, setSelected] = useState<BlogRecord | null>(null);
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [baseline, setBaseline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [bodyUploads, setBodyUploads] = useState(0);
  const [coverUploads, setCoverUploads] = useState(0);
  const uploads = bodyUploads + coverUploads;
  const [preview, setPreview] = useState(false);
  const { ask, confirmation } = useContentConfirmation();
  const dirty = uploads > 0 || (draft !== null && JSON.stringify(draft) !== baseline);
  useUnsavedGuard(dirty, ask);
  useEffect(() => {
    const controller = new AbortController();
    blogRequest(undefined, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '載入失敗');
      });
    return () => controller.abort();
  }, []);
  const canLeave = async () => !dirty || (await ask('尚有未儲存的修改，確定捨棄？'));
  function open(nextKind: BlogKind, row?: BlogRecord) {
    const value = row?.draft ?? newDraft(nextKind, data);
    setKind(nextKind);
    setSelected(row ?? null);
    setDraft(structuredClone(value));
    setBaseline(JSON.stringify(value));
    setPreview(false);
    setBodyUploads(0);
    setCoverUploads(0);
  }
  async function choose(nextKind: BlogKind, row?: BlogRecord) {
    if (!busy && (await canLeave())) open(nextKind, row);
  }
  async function changeKind(nextKind: BlogKind) {
    if (busy || !(await canLeave())) return;
    setKind(nextKind);
    setSelected(null);
    setDraft(null);
    setPreview(false);
    setBodyUploads(0);
    setCoverUploads(0);
  }
  async function reload() {
    if (busy || !(await canLeave())) return;
    setBusy(true);
    try {
      setData(await blogRequest());
      setSelected(null);
      setDraft(null);
      setError('');
      setBodyUploads(0);
      setCoverUploads(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '載入失敗');
    } finally {
      setBusy(false);
    }
  }
  function recoverSelection(next: Awaited<ReturnType<typeof blogRequest>>, action: BlogCommand['action']) {
    const row =
      action === 'delete' ? undefined : blogRows(next, kind).find(item => item.id === (next.savedId ?? selected?.id));
    if (row) open(kind, row);
    else {
      setSelected(null);
      setDraft(null);
    }
  }
  async function perform(action: BlogCommand['action']) {
    if (!draft || busy || uploads > 0) return;
    if (['publish', 'unpublish'].includes(action) && dirty) return;
    const notices: Partial<Record<BlogCommand['action'], string>> = {
      delete: `確定刪除此${label[kind]}？`,
      publish: '確定將已儲存的草稿發佈到前台？',
      unpublish: '確定下架？前台將無法查看此內容。'
    };
    const notice = notices[action];
    if (notice && !(await ask(notice))) return;
    const saves = action === 'create' || action === 'save';
    const validated = draftSchemas[kind].safeParse(draft);
    if (saves && !validated.success) {
      toast.error(validated.error.issues[0]?.message ?? '內容格式無效');
      return;
    }
    setBusy(true);
    try {
      const next = await blogRequest({
        kind,
        action,
        id: selected?.id,
        version: selected?.version,
        ...(saves ? { draft } : {})
      });
      setData(next);
      setPreview(false);
      recoverSelection(next, action);
      toast.success('操作成功');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : '操作失敗');
    } finally {
      setBusy(false);
    }
  }
  async function showPreview() {
    if (!selected || dirty || busy) return;
    setBusy(true);
    try {
      const next = await blogRequest();
      const row = blogRows(next, kind).find(item => item.id === selected.id);
      if (!row) throw new Error('內容已被刪除，請重新載入');
      setData(next);
      open(kind, row);
      setPreview(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : '預覽失敗');
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    kind,
    selected,
    draft,
    setDraft,
    busy,
    error,
    uploads,
    setUploads: setBodyUploads,
    setCoverUploads,
    preview,
    setPreview,
    dirty,
    confirmation,
    choose,
    changeKind,
    reload,
    perform,
    showPreview
  };
}
export type BlogController = ReturnType<typeof useBlog>;
