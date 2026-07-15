import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import zhHK from 'antd/es/locale/zh_HK';
import type { Locale } from 'antd/lib/locale';

export const antdLocales: Record<I18n.LangType, Locale> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-HK': zhHK
};
