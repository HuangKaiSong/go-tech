'use client';

import { useEffect } from 'react';

type Props = {
  locale: string;
};

export default function LocaleInitializer({ locale }: Props) {
  useEffect(() => {
    void fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });
  }, [locale]);

  return null;
}
