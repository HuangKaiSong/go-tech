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
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className="md:hidden order-last flex items-center rounded-full border border-white/30 p-0.5 text-xs"
        role="group"
        aria-label="切換語言"
      >
        {options.map(opt => (
          <Link
            key={opt.code}
            className={`flex items-center justify-center gap-1 cursor-pointer w-7 h-6 rounded-full font-medium transition-colors ${locale === opt.code ? 'bg-primary text-primary-foreground' : 'text-white/80'}`}
            href={{ pathname }}
            locale={opt.code}
            replace
            aria-pressed={locale === opt.code}
          >
            <span>{opt.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
