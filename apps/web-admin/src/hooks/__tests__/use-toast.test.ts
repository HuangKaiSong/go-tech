import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ToastProps } from '@go-tech-frontend/ui';

type ToasterToast = ToastProps & {
  action?: any;
  description?: React.ReactNode;
  id: string;
  title?: React.ReactNode;
};

const TOAST_REMOVE_DELAY = 1_000_000;

function makeToast(id: string, extra: Partial<ToasterToast> = {}): ToasterToast {
  return { id, open: true, title: `t-${id}`, ...extra } as ToasterToast;
}

/** 每个用例重新加载模块，避开模块级单例（memoryState / listeners / toastTimeouts）互相污染 */
async function loadModule() {
  vi.resetModules();
  return await import('../use-toast');
}

/* ------------------------------------------------------------------ */
/* reducer                                                             */
/* ------------------------------------------------------------------ */
describe('use-toast reducer', () => {
  let reducer: (typeof import('../use-toast'))['reducer'];

  beforeEach(async () => {
    vi.useFakeTimers();
    ({ reducer } = await loadModule());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('ADD_TOAST：把新 toast 放在最前面', () => {
    const state = { toasts: [] as ToasterToast[] };
    const next = reducer(state, { type: 'ADD_TOAST', toast: makeToast('1') });
    expect(next.toasts.map(t => t.id)).toEqual(['1']);
    expect(next.toasts[0].open).toBe(true);
  });

  it('ADD_TOAST：超过 TOAST_LIMIT 时丢弃旧的', () => {
    let state = { toasts: [] as ToasterToast[] };
    state = reducer(state, { type: 'ADD_TOAST', toast: makeToast('1') });
    state = reducer(state, { type: 'ADD_TOAST', toast: makeToast('2') });
    // TOAST_LIMIT = 1
    expect(state.toasts.map(t => t.id)).toEqual(['2']);
  });

  it('UPDATE_TOAST：按 id 合并，未覆盖字段保留', () => {
    let state = { toasts: [makeToast('1', { title: 'old' })] };
    state = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'new' }
    });
    expect(state.toasts[0].title).toBe('new');
    expect(state.toasts[0].open).toBe(true);
  });

  it('UPDATE_TOAST：id 不匹配时不动任何 toast', () => {
    const state = { toasts: [makeToast('1', { title: 'old' })] };
    const next = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: 'other', title: 'new' }
    });
    expect(next.toasts[0].title).toBe('old');
  });

  it('DISMISS_TOAST：带 id 只关闭对应 toast', () => {
    const state = { toasts: [makeToast('1'), makeToast('2')] };
    const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(next.toasts.find(t => t.id === '1')!.open).toBe(false);
    expect(next.toasts.find(t => t.id === '2')!.open).toBe(true);
  });

  it('DISMISS_TOAST：不带 id 关闭全部', () => {
    const state = { toasts: [makeToast('1'), makeToast('2')] };
    const next = reducer(state, { type: 'DISMISS_TOAST' });
    expect(next.toasts.every(t => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST：带 id 删除指定 toast', () => {
    const state = { toasts: [makeToast('1'), makeToast('2')] };
    const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(next.toasts.map(t => t.id)).toEqual(['2']);
  });

  it('REMOVE_TOAST：不带 id 清空全部', () => {
    const state = { toasts: [makeToast('1'), makeToast('2')] };
    const next = reducer(state, { type: 'REMOVE_TOAST' });
    expect(next.toasts).toEqual([]);
  });

  it('未知 action：原样返回新对象', () => {
    const state = { toasts: [makeToast('1')] };
    const next = reducer(state, { type: 'UNKNOWN' } as any);
    expect(next).toEqual(state);
    expect(next).not.toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/* toast() + useToast()                                                */
/* ------------------------------------------------------------------ */
describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('初始状态为空', async () => {
    const { useToast } = await loadModule();
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('调用 toast() 后 hook 能读到新 toast', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'hello' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('hello');
    expect(result.current.toasts[0].open).toBe(true);
  });

  it('toast() 返回的 id / update / dismiss 可用', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    let handle!: ReturnType<typeof toast>;
    act(() => {
      handle = toast({ title: 'hello' });
    });

    expect(result.current.toasts[0].id).toBe(handle.id);

    act(() => {
      handle.update({ id: handle.id, title: 'updated' } as any);
    });
    expect(result.current.toasts[0].title).toBe('updated');

    act(() => {
      handle.dismiss();
    });
    expect(result.current.toasts[0].open).toBe(false);
  });

  it('dismiss() 不带 id 关闭全部（TOAST_LIMIT=1 时只留最新一条）', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'a' });
    });
    act(() => {
      toast({ title: 'b' });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.toasts.every(t => !t.open)).toBe(true);
  });

  it('onOpenChange(false) 等价于 dismiss', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'a' });
    });

    act(() => {
      result.current.toasts[0].onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('dismiss 后经过 TOAST_REMOVE_DELAY 才真正移除', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    let handle!: ReturnType<typeof toast>;
    act(() => {
      handle = toast({ title: 'a' });
    });

    act(() => {
      handle.dismiss();
    });
    // 只是 open=false，还在列表里
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].open).toBe(false);

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('同一 id 重复 dismiss 不会重复注册移除定时器', async () => {
    const { toast, useToast } = await loadModule();
    const { result } = renderHook(() => useToast());

    let handle!: ReturnType<typeof toast>;
    act(() => {
      handle = toast({ title: 'a' });
    });

    act(() => {
      handle.dismiss();
      handle.dismiss(); // 第二次应被 toastTimeouts.has 拦截
    });

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('多个 hook 实例共享同一份状态', async () => {
    const { toast, useToast } = await loadModule();
    const a = renderHook(() => useToast());
    const b = renderHook(() => useToast());

    act(() => {
      toast({ title: 'shared' });
    });

    expect(a.result.current.toasts[0].title).toBe('shared');
    expect(b.result.current.toasts[0].title).toBe('shared');
  });

  it('hook 卸载后调用 toast 不应抛错', async () => {
    const { toast, useToast } = await loadModule();
    const { unmount } = renderHook(() => useToast());

    unmount();

    expect(() => {
      act(() => {
        toast({ title: 'after unmount' });
      });
    }).not.toThrow();
  });
});
