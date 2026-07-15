import { LangEffect } from '@go-tech/web-admin-i18n';
import { ThemeEffect } from '@go-tech/web-admin-theme';

import { syncLocales } from '@/locales/sync';

const GlobalEffect = () => {
  return (
    <>
      <ThemeEffect />
      <LangEffect onLocaleChange={syncLocales} />
    </>
  );
};

export default GlobalEffect;
