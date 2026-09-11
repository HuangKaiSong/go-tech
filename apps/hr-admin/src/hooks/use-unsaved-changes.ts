import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * 表單「未儲存變更」守衛。
 *
 * 傳入需要追蹤的表單狀態（任意可序列化物件）；與基準快照比對得出 isDirty。 - markSaved(message?)：把當前狀態設為新基準（表示已儲存），可選帶成功 toast。 -
 * confirmLeave()：無變更時直接返回 true；有變更時彈確認框，返回用戶選擇。 另外在瀏覽器關閉/刷新時，若有未儲存變更會提示。
 *
 * @param watched 需追蹤的表單狀態
 */
export function useUnsavedChanges<T>(watched: T) {
  const serialize = (v: T) => {
    try {
      return JSON.stringify(v);
    } catch {
      return '';
    }
  };

  const current = serialize(watched);
  const baselineRef = useRef(current);
  // 保存最新序列化值，供 callback 讀取，避免依賴頻繁變動
  const currentRef = useRef(current);
  currentRef.current = current;

  // isDirty 於渲染期即時計算；watched 變動會使父元件重渲染，這裡隨之更新
  const isDirty = current !== baselineRef.current;

  // 瀏覽器關閉/刷新守衛
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (currentRef.current !== baselineRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const markSaved = useCallback((message?: string) => {
    baselineRef.current = currentRef.current;
    if (message) {
      toast.success(message);
    }
  }, []);

  const confirmLeave = useCallback(() => {
    if (currentRef.current === baselineRef.current) {
      return true;
    }
    return window.confirm('有未儲存的變更，確定要離開嗎？');
  }, []);

  return { isDirty, markSaved, confirmLeave };
}
