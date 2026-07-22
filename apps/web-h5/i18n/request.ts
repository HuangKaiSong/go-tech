import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { loadLocale } from '../locales';

export default getRequestConfig(async ({ locale }) => {
  const store = await cookies();

  const lang =
    locale ??
    store.get('GO_TECH_LANGUAGE')?.value ??
    'zh-hk';

  const messages = loadLocale(lang);

  return {
    locale: lang,
    messages
  };
});
