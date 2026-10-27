'use client';

import { type BlogList, type BlogQuery, listSchema, querySchema } from '@go-tech/blog-content/model';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/client-http/client-fetch';

export function useBlogList(initial: BlogList) {
  const params = useSearchParams();
  const raw = {
    categoryId: params.get('categoryId') ?? undefined,
    q: params.get('q') ?? '',
    page: params.get('page') ?? 1
  };
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : initial.query;
  const key = JSON.stringify(query);
  const initialKey = JSON.stringify(initial.query);
  const [result, setResult] = useState({ key: initialKey, data: initial });
  const [input, setInput] = useState(initial.query.q);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    clearTimeout(timer.current);
    const current: BlogQuery = JSON.parse(key);
    setInput(current.q);
    if (key === initialKey && retry === 0) {
      setResult({ key, data: initial });
      setError('');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const requestParams = new URLSearchParams({ q: current.q, page: String(current.page) });
    if (current.categoryId) requestParams.set('categoryId', String(current.categoryId));
    setLoading(true);
    setError('');
    clientFetch(`/api/blog?${requestParams}`, { signal: controller.signal }, { feedback: 'silent' })
      .then(response => response.json())
      .then((response: unknown) => {
        if (controller.signal.aborted) return;
        const data = response && typeof response === 'object' && 'data' in response ? response.data : undefined;
        setResult({ key, data: listSchema.parse(data) });
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '博客載入失敗');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, initial, initialKey, retry]);
  function navigate(next: BlogQuery) {
    clearTimeout(timer.current);
    const url = new URL(window.location.href);
    if (next.categoryId) url.searchParams.set('categoryId', String(next.categoryId));
    else url.searchParams.delete('categoryId');
    if (next.q) url.searchParams.set('q', next.q);
    else url.searchParams.delete('q');
    if (next.page > 1) url.searchParams.set('page', String(next.page));
    else url.searchParams.delete('page');
    window.history.pushState(null, '', `${url.pathname}${url.search}`);
  }
  function search(value: string) {
    setInput(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ ...query, q: value.trim(), page: 1 }), 200);
  }
  return {
    data: result.data,
    input,
    query,
    error,
    loading: loading || (!error && key !== result.key),
    search,
    selectCategory: (categoryId?: number) => navigate({ categoryId, q: input.trim(), page: 1 }),
    selectPage: (page: number) => navigate({ ...query, page }),
    retry: () => setRetry(value => value + 1)
  };
}
