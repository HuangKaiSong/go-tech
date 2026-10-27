import { toast } from '@go-tech-frontend/ui';
import {
  type ManualAdminData,
  type ManualCommand,
  type ManualKind,
  type ManualRecord,
  draftSchemas
} from '@go-tech/manual-content/model';
import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { manualRequest } from './api';
import { useManualConfirmation } from './confirmation';
import { type Selection, makeSelection, manualRows, mutationNotice, mutationSuccess } from './selection';

/** 同时拦截应用内路由切换与关闭页面；组件清理后不再处理异步确认结果。 */
function useUnsavedGuard(dirty: boolean, ask: (message: string) => Promise<boolean>) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    ask('尚有未儲存的修改，確定離開？').then(result => {
      if (!active) return;
      if (result) blocker.proceed();
      else blocker.reset();
    });
    return () => {
      active = false;
    };
  }, [blocker, ask]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
}

/** 统筹后台草稿会话、保存/发布状态及错误反馈，不通过公开接口加载草稿。 */
export function useManual() {
  const [data, setData] = useState<ManualAdminData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageUploads, setImageUploads] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState<ManualKind>('article');
  const { ask, confirmation } = useManualConfirmation();
  // 未完成的图片还没有进入正文，也必须参与离开确认和保存限制。
  const dirty = imageUploads > 0 || (selection !== null && JSON.stringify(selection.draft) !== selection.baseline);
  useUnsavedGuard(dirty, ask);
  useEffect(() => {
    const controller = new AbortController();
    manualRequest(undefined, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '載入失敗');
      });
    return () => controller.abort();
  }, []);
  const canLeave = async () => !dirty || (await ask('尚有未儲存的修改，確定捨棄？'));
  /** 切换编辑记录前处理本地未保存修改，防止误丢弃内容。 */
  async function choose(kind: ManualKind, row?: ManualRecord) {
    if (!data || !(await canLeave())) return;
    setPreview(false);
    setSelection(makeSelection(kind, data, row));
  }
  /** 管理种类变化时清空当前编辑与预览状态，避免复用不匹配的表单。 */
  async function changeTab(kind: ManualKind) {
    if (!(await canLeave())) return;
    setTab(kind);
    setSelection(null);
    setPreview(false);
  }
  /** 提交当前记录版本；成功后按服务端返回 ID 恢复编辑会话，冲突时保留本地修改。 */
  async function perform(action: ManualCommand['action']) {
    if (!selection) return;
    if (imageUploads > 0 && action !== 'delete') {
      toast.error('請先完成或取消圖片上傳');
      return;
    }
    const notice = mutationNotice(action);
    if (notice && !(await ask(notice))) return;
    const saves = action === 'save' || action === 'create';
    const validation = draftSchemas[selection.kind].safeParse(selection.draft);
    if (saves && !validation.success) {
      toast.error(validation.error.issues[0]?.message ?? '內容格式無效');
      return;
    }
    setBusy(true);
    try {
      const next = await manualRequest({
        kind: selection.kind,
        action,
        id: selection.record?.id,
        version: selection.record?.version,
        ...(saves ? { draft: selection.draft } : {})
      });
      setData(next);
      setPreview(false);
      setSelection(null);
      if (action !== 'delete') {
        const row = manualRows(next, selection.kind).find(item => item.id === (next.savedId ?? selection.record?.id));
        if (row) setSelection(makeSelection(selection.kind, next, row));
      }
      toast.success(mutationSuccess(action));
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : '操作失敗');
    } finally {
      setBusy(false);
    }
  }
  /** 显式刷新服务器资料；先确认是否丢弃本地草稿，不自动覆盖用户正在编辑的内容。 */
  async function reload() {
    if (!(await canLeave())) return;
    setBusy(true);
    try {
      setData(await manualRequest());
      setSelection(null);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '載入失敗');
    } finally {
      setBusy(false);
    }
  }
  /** 先经过认证接口重读已保存草稿，确保预览对应当前服务端版本且不暴露公开预览地址。 */
  async function showPreview() {
    if (!selection?.record || dirty) return;
    setBusy(true);
    try {
      const next = await manualRequest();
      const row = manualRows(next, selection.kind).find(item => item.id === selection.record?.id);
      if (!row) throw new Error('內容已被刪除，請重新載入');
      setData(next);
      setSelection(makeSelection(selection.kind, next, row));
      setPreview(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : '預覽失敗');
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    error,
    busy,
    imageUploads,
    setImageUploads,
    selection,
    setSelection,
    preview,
    setPreview,
    tab,
    dirty,
    confirmation,
    choose,
    changeTab,
    perform,
    reload,
    showPreview
  };
}
export type ManualController = ReturnType<typeof useManual>;
