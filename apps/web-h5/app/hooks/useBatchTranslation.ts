import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type BatchItem = {
  locale: string;
  reject: (reason?: any) => void;
  resolve: (value: string) => void; // 记录请求时的 locale
  text: string;
};

let batchQueue: BatchItem[] = [];
let scheduled = false;

function flushBatch(locale: any) {
  if (batchQueue.length === 0) {
    scheduled = false;
    return;
  }

  const items = batchQueue;
  batchQueue = [];
  scheduled = false;

  // 过滤空字符串，避免 API 报错
  const nonEmptyItems = items.filter(item => item.text !== '');
  const emptyItems = items.filter(item => item.text === '');

  // 空字符串项直接 resolve 为空字符串
  emptyItems.forEach(item => item.resolve(''));

  if (nonEmptyItems.length === 0) return;

  const texts = nonEmptyItems.map(item => item.text);
  fetch('/api/translate/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, locale })
  })
    .then(res => res.json())
    .then(data => {
      const translations = data.translations || {};
      nonEmptyItems.forEach(item => {
        const translated = translations[item.text];
        if (translated) {
          item.resolve(translated);
        } else {
          item.reject(new Error('No translation found'));
        }
      });
    })
    .catch(err => {
      nonEmptyItems.forEach(item => item.reject(err));
    });
}

function scheduleBatch(locale: any) {
  if (!scheduled) {
    scheduled = true;
    // 使用微任务确保在当前事件循环中收集所有组件
    queueMicrotask(() => flushBatch(locale));
  }
}

export function useBatchTranslation(text: string): string {
  const locale = useLocale();

  const [translated, setTranslated] = useState<string>(text);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // 空字符串无需翻译，直接返回
    if (!text) {
      setTranslated(text);
      return;
    }

    let resolved = false;
    const promise = new Promise<string>((resolve, reject) => {
      batchQueue.push({ text, resolve, reject, locale });
      scheduleBatch(locale);
    });

    promise
      .then(val => {
        if (isMounted.current && !resolved) {
          resolved = true;
          setTranslated(val);
        }
      })
      .catch(() => {
        if (isMounted.current && !resolved) {
          resolved = true;
          setTranslated(text); // 降级返回原文
        }
      });

    return () => {
      isMounted.current = false;
      // 可在此取消未完成的请求（使用 AbortController 更复杂，此处简化）
    };
  }, [text, locale]);

  return translated;
}
