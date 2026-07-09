import type { AdminLocaleMessages } from '../langs';

type DatatableMessages = AdminLocaleMessages['datatable'];
type FormMessages = AdminLocaleMessages['form'];
type IconMessages = AdminLocaleMessages['icon'];
type NotificationMessages = AdminLocaleMessages['notification'];
type PageMessages = AdminLocaleMessages['page'];
type RequestMessages = AdminLocaleMessages['request'];
type SystemMessages = AdminLocaleMessages['system'];
type ThemeMessages = AdminLocaleMessages['theme'];

declare global {
  namespace I18n {
    /** Register the languages shipped by this package (merged into core LangRegistry). */
    interface LangRegistry {
      'zh-HK': true;
    }

    interface LocaleMessages {
      notification: Notification;
    }

    interface Datatable extends DatatableMessages {}
    interface Form extends FormMessages {}
    interface Icon extends IconMessages {}
    interface Notification extends NotificationMessages {}
    interface Page extends PageMessages {}
    interface Request extends RequestMessages {}
    interface System extends SystemMessages {}
    interface Theme extends ThemeMessages {}
  }
}


