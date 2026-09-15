'use client';

import { useEffect } from 'react';
import { clientFetch } from '@/lib/client-http/client-fetch';

type Props = {
  locale: string;
};

export default function LocaleInitializer({ locale }: Props) {
  useEffect(() => {
    clientFetch(
      '/api/locale',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale })
      },
      { feedback: 'silent' }
    ).catch(() => {
      // 语言 cookie 同步失败不打断当前页面，后续导航仍会按 URL locale 初始化。
    });
  }, [locale]);

  return null;
}
