import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async (params) => {

  const store = await cookies();
  const locale = params.locale || store.get('GO_TECH_LANGUAGE')?.value || 'hk'
  const messages = (await import(`../locales/${locale}.json`)).default;

  return {
    locale,
    messages
  };
});