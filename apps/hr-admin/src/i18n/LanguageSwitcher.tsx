import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LOCALES, type LocaleValue, setLang } from '@/i18n';

/** 語言切換器：Header 右上角下拉，切換繁/簡/英並持久化 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as LocaleValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          aria-label="切換語言"
        >
          <Languages className="h-4.5 w-4.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={current} onValueChange={v => setLang(v as LocaleValue)}>
          {LOCALES.map(l => (
            <DropdownMenuRadioItem key={l.value} value={l.value}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
