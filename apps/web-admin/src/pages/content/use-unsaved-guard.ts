import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/** 同时拦截应用内路由切换与关闭页面；组件清理后不再处理异步确认结果。 */
export function useUnsavedGuard(dirty: boolean, ask: (message: string) => Promise<boolean>) {
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
