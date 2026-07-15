// @unocss-include
import { getHsl } from '@go-tech/color';
import { toggleCssDarkMode } from '@go-tech/web-admin-theme';
import { clsx } from 'clsx';

import SystemLogo from '@/components/SystemLogo';
import { globalConfig } from '@/config';

const GlobalLoading = memo(() => {
  const { t } = useTranslation();

  const { defaultDarkMode, defaultThemeColor } = globalConfig;

  if (defaultDarkMode) {
    toggleCssDarkMode(true);
  }

  const { h, l, s } = getHsl(defaultThemeColor);

  const loadingClasses = [
    'left-0 top-0',
    'left-0 bottom-0 animate-delay-500',
    'right-0 top-0 animate-delay-1000',
    'right-0 bottom-0 animate-delay-1500'
  ];

  return (
    <div
      className="fixed-center flex-col bg-layout"
      style={{ '--primary-color': `${h} ${s}% ${l}%` } as React.CSSProperties}
    >
      <SystemLogo />
      <div className="my-4xl size-4xl">
        <div className="relative h-full animate-spin">
          {loadingClasses.map(item => {
            return <div className={clsx('absolute size-md animate-pulse rounded-lg bg-primary', item)} key={item} />;
          })}
        </div>
      </div>
      <h2 className="text-2xl text-primary font-500">HR {t('system.title')}</h2>
      <div className="text-sm text-#999 ">企業人力資源平台</div>
    </div>
  );
});

export default GlobalLoading;
