'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import Link from './Link';

const options = [
  { code: 'zh-hk', label: '繁' },
  { code: 'zh-cn', label: '简' },
  { code: 'en-us', label: 'EN' }
] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // const router = useProgressRouter();

  // async function switchTo(nextLocale: string) {
  //   if (nextLocale === locale) return;

  //   await fetch('/api/locale', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ locale: nextLocale })
  //   });

  //   router.refresh();
  // }

  return (
    <div className="flex flex-row gap-1 text-white text-sm items-center">
      {options.map((opt, index) => (
        <Link key={opt.code} className="flex items-center gap-1" href={{ pathname }} locale={opt.code} replace>
          <span className={`cursor-pointer ${locale === opt.code ? 'text-primary' : ''}`}>{opt.label}</span>
          {index < options.length - 1 ? <span className="opacity-40">|</span> : null}
        </Link>
      ))}
    </div>
  );
}
