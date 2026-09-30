import { Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function VersionSwitcher() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('版本切換')}
      className="fixed right-4 top-2 z-40 hidden items-center gap-0.5 rounded-full border bg-card/95 p-1 text-xs shadow-md md:flex"
    >
      <span
        aria-current="page"
        className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground"
      >
        <Monitor aria-hidden="true" className="h-3 w-3" />
        {t('PC版')}
      </span>
      <a
        href="https://m-hrm.go-techs.com/"
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Smartphone aria-hidden="true" className="h-3 w-3" />
        {t('手機版')}
      </a>
    </nav>
  );
}
