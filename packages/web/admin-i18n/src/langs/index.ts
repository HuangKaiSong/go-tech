import type { ResourceLanguage } from 'i18next';

import enUSCommon from './en-us/common.json';
import enUSDatatable from './en-us/datatable.json';
import enUSDropdown from './en-us/dropdown.json';
import enUSForm from './en-us/form.json';
import enUSIcon from './en-us/icon.json';
import enUSNotification from './en-us/notification.json';
import enUSPage from './en-us/page.json';
import enUSRequest from './en-us/request.json';
import enUSRoute from './en-us/route.json';
import enUSSystem from './en-us/system.json';
import enUSTheme from './en-us/theme.json';
import zhCNCommon from './zh-cn/common.json';
import zhCNDatatable from './zh-cn/datatable.json';
import zhCNDropdown from './zh-cn/dropdown.json';
import zhCNForm from './zh-cn/form.json';
import zhCNIcon from './zh-cn/icon.json';
import zhCNNotification from './zh-cn/notification.json';
import zhCNPage from './zh-cn/page.json';
import zhCNRequest from './zh-cn/request.json';
import zhCNRoute from './zh-cn/route.json';
import zhCNSystem from './zh-cn/system.json';
import zhCNTheme from './zh-cn/theme.json';
import zhHKCommon from './zh-hk/common.json';
import zhHKDatatable from './zh-hk/datatable.json';
import zhHKDropdown from './zh-hk/dropdown.json';
import zhHKForm from './zh-hk/form.json';
import zhHKIcon from './zh-hk/icon.json';
import zhHKNotification from './zh-hk/notification.json';
import zhHKPage from './zh-hk/page.json';
import zhHKRequest from './zh-hk/request.json';
import zhHKRoute from './zh-hk/route.json';
import zhHKSystem from './zh-hk/system.json';
import zhHKTheme from './zh-hk/theme.json';

import type { LangType } from '../types';

const enUS = {
  common: enUSCommon,
  datatable: enUSDatatable,
  dropdown: enUSDropdown,
  form: enUSForm,
  icon: enUSIcon,
  notification: enUSNotification,
  page: enUSPage,
  request: enUSRequest,
  route: enUSRoute,
  system: enUSSystem,
  theme: enUSTheme
} satisfies ResourceLanguage;

const zhCN = {
  common: zhCNCommon,
  datatable: zhCNDatatable,
  dropdown: zhCNDropdown,
  form: zhCNForm,
  icon: zhCNIcon,
  notification: zhCNNotification,
  page: zhCNPage,
  request: zhCNRequest,
  route: zhCNRoute,
  system: zhCNSystem,
  theme: zhCNTheme
} satisfies ResourceLanguage;

const zhHK = {
  common: zhHKCommon,
  datatable: zhHKDatatable,
  dropdown: zhHKDropdown,
  form: zhHKForm,
  icon: zhHKIcon,
  notification: zhHKNotification,
  page: zhHKPage,
  request: zhHKRequest,
  route: zhHKRoute,
  system: zhHKSystem,
  theme: zhHKTheme
} satisfies ResourceLanguage;

export type AdminLocaleMessages = typeof zhCN;

export const localeResources: Record<LangType, ResourceLanguage> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-HK': zhHK
};

export default localeResources;
