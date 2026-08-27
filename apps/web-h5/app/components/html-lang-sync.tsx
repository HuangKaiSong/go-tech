'use client';

import { useEffect } from 'react';
import type { Locale } from '@/i18n/config';

export function HtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
