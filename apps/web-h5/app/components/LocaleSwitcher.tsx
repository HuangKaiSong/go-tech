'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@go-tech-frontend/ui';
import { useLocale } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { withProductQuery } from '@/app/lib/product-navigation';
import { useIframeContext } from '@/contexts/IframeContext';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';
import { usePathname, useRouter } from '@/i18n/navigation';
import Link from './Link';

const options = [
  { code: 'zh-hk', label: '繁' },
  { code: 'zh-cn', label: '简' },
  { code: 'en-us', label: 'EN' }
] as const;

interface LocaleSwitcherProps {
  type?: 'inline' | 'select';
}

export default function LocaleSwitcher({ type = 'select' }: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { hasIframe } = useIframeContext();
  const productSelection = useOptionalProductSelection();
  const [isPending, startTransition] = useTransition();
  const [pointerFocus, setPointerFocus] = useState(false);

  useEffect(() => {
    if (!pointerFocus) return;
    const restoreKeyboardFocus = () => setPointerFocus(false);
    document.addEventListener('keydown', restoreKeyboardFocus, true);
    return () => document.removeEventListener('keydown', restoreKeyboardFocus, true);
  }, [pointerFocus]);

  const switchLocale = (value: string) => {
    const nextLocale = options.find(option => option.code === value)?.code;
    if (!nextLocale || nextLocale === locale || hasIframe || isPending) return;

    startTransition(() => {
      router.replace(withProductQuery(pathname, productSelection?.product), {
        locale: nextLocale,
        scroll: false
      });
    });
  };

  if (type === 'select') {
    return (
      <Select value={locale} onValueChange={switchLocale} disabled={hasIframe || isPending}>
        <SelectTrigger
          className={`h-8 w-auto rounded-full border-white/30 bg-transparent text-xs text-white focus:ring-0 focus:ring-offset-0 [&>svg]:hidden ${pointerFocus ? '' : 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'}`}
          onPointerDownCapture={() => setPointerFocus(true)}
          aria-label="切換語言"
          aria-busy={isPending}
          title={hasIframe ? '在 iframe 中不可用' : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          // Radix restores focus on close; browsers can retain :focus-visible after mixed keyboard/pointer input.
          onPointerDownCapture={() => setPointerFocus(true)}
          onPointerDownOutside={() => setPointerFocus(true)}
        >
          {options.map(opt => (
            <SelectItem key={opt.code} value={opt.code}>
              {/* {localeNames[opt.code]} */}
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

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
