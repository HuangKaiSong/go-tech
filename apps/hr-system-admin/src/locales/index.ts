import { setupI18n as setupCoreI18n } from '@go-tech/web-admin-i18n';
import type { LocaleSetupOptions, ResourceLanguage } from '@go-tech/web-admin-i18n';

import { globalConfig } from '@/config';
import { localStg } from '@/utils/storage';

export { $t } from '@go-tech/web-admin-i18n';

const appLocales: Record<I18n.LangType, () => Promise<ResourceLanguage>> = {
  'zh-CN': () => import('./langs/zh-cn').then(m => m.default),
  'zh-HK': () => import('./langs/zh-hk').then(m => m.default),
  'en-US': () => import('./langs/en-us').then(m => m.default)
};

/** Setup plugin i18n */
export async function setupI18n(options: LocaleSetupOptions<I18n.LangType> = {}) {
  await setupCoreI18n({
    defaultLocale: globalConfig.defaultLang,
    fallbackLocale: 'en-US',
    localeOptions: globalConfig.defaultLangOptions,
    missingWarn: import.meta.env.DEV,
    storage: {
      getLocale: () => localStg.get('lang'),
      setLocale: lang => localStg.set('lang', lang)
    },
    loadAppMessages: lang => appLocales[lang](),
    ...options
  });
}
