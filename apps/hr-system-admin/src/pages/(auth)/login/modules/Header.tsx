import { ThemeSchemaSwitch, useSettingsTheme } from '@go-tech/web-admin-theme';
import { FlipText } from '@go-tech/web-ui-compose';

import { LangSwitch } from '@go-tech/web-admin-i18n';
import SystemLogo from '@/components/SystemLogo';

const Header = memo(() => {
  const { t } = useTranslation();
  const { header } = useSettingsTheme();

  return (
    <header className="flex-y-center justify-between">
      <SystemLogo />

      <FlipText className="text-3xl text-primary font-500 lt-sm:text-2xl" word={`HR ${t('system.title')}`} />

      <div className="i-flex-col">
        <ThemeSchemaSwitch className="text-xl lt-sm:text-lg" showTooltip={false} />
        <LangSwitch showTooltip={false} visible={header.multilingual.visible} />
      </div>
    </header>
  );
});

export default Header;
