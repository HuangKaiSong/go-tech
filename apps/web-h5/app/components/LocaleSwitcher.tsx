'use client';

import { ArrowRightLeft } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  async function handleSwitchLang() {
    const nextLocale = locale === 'hk' ? 'en' : 'hk';

    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale })
    });

    router.refresh();
  }

  return (
    <div className="flex flex-row gap-2 text-white text-sm items-center" onClick={() => handleSwitchLang()}>
      <div>
        <span className={locale === 'hk' ? 'text-primary' : ''}>繁</span>
        <span className={locale === 'en' ? 'text-primary' : ''}>簡</span>
      </div>
      <ArrowRightLeft className="w-4 h-4" />
    </div>
  );
}
