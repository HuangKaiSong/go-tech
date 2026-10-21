// oxlint-disable no-await-in-loop -- Each streaming read depends on completion of the previous read.
'use client';
import { useRouter } from 'next/navigation';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { publishClientSnapshot } from './client-store';
import { type PublicSnapshot } from './definitions';
import { ConfigEventDecoder, parsePublicSnapshot } from './sse';
const Context = createContext<PublicSnapshot>({ version: '', values: {} });
export const useRuntimeConfig = () => useContext(Context);
export function RuntimeConfigProvider({ children, initial }: { children: ReactNode; initial: PublicSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const router = useRouter();
  // The root provider sits outside next-intl. Preserve language from the document on routing default changes.
  useEffect(() => {
    publishClientSnapshot(snapshot);
  }, [snapshot]);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    let current = initial;
    const accept = (next: PublicSnapshot) => {
      if (!parsePublicSnapshot(next) || next.version === current.version) return;
      const oldLanguage = current.values.GO_TECH_LANGUAGE;
      current = next;
      delay = 1000;
      publishClientSnapshot(next);
      setSnapshot(next);
      if (oldLanguage !== next.values.GO_TECH_LANGUAGE) {
        const locale = document.documentElement.lang.toLowerCase();
        const pathname = location.pathname;
        const hasPrefix = /^\/(en-us|zh-hk|zh-cn)(\/|$)/.test(pathname);
        if (!hasPrefix && ['en-us', 'zh-hk', 'zh-cn'].includes(locale) && locale !== next.values.GO_TECH_LANGUAGE) {
          router.replace(`/${locale}${pathname === '/' ? '' : pathname}${location.search}${location.hash}`);
          return;
        }
      }
      router.refresh();
    };
    const connect = async () => {
      if (disposed || document.hidden || !navigator.onLine) return;
      controller?.abort();
      controller = new AbortController();
      const activeController = controller;
      const signal = activeController.signal;
      let idle = false;
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      const touch = () => {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          idle = true;
          activeController.abort();
        }, 45000);
      };
      touch();
      try {
        const response = await clientFetch(
          '/api/runtime-config/events',
          { signal, cache: 'no-store' },
          { feedback: 'silent', diagnostics: false }
        );
        if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))
          throw new Error('Invalid configuration stream');
        const reader = response.body.getReader();
        const decoder = new ConfigEventDecoder();
        try {
          while (!signal.aborted) {
            const chunk = await reader.read();
            if (chunk.done) break;
            touch();
            for (const next of decoder.push(chunk.value)) accept(next);
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      } catch {
        /* Reconnect silently, preserving the last successful snapshot. */
      } finally {
        if (watchdog) clearTimeout(watchdog);
      }
      if (!disposed && (!signal.aborted || idle) && !document.hidden) {
        retry = setTimeout(
          () => {
            connect();
          },
          delay + Math.random() * 500
        );
        delay = Math.min(delay * 2, 30000);
      }
    };
    const resume = () => {
      if (retry) clearTimeout(retry);
      controller?.abort();
      if (!document.hidden && navigator.onLine) connect();
    };
    connect();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    return () => {
      disposed = true;
      controller?.abort();
      if (retry) clearTimeout(retry);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
    };
  }, [initial, router]);
  return <Context.Provider value={snapshot}>{children}</Context.Provider>;
}
