
import type { AdminLocaleMessages } from '@go-tech/web-admin-i18n';
import type page from './langs/zh-cn/page.json';
import type route from './langs/zh-cn/route.json';

type AppPageMessages = typeof page;
type AppRouteMessages = typeof route;
type BasePageMessages = AdminLocaleMessages['page'];
type AppPageExtensions = Omit<AppPageMessages, keyof BasePageMessages>;

declare global {
  namespace I18n {
    interface Page extends AppPageExtensions {
      home: BasePageMessages['home'] & AppPageMessages['home'];
    }

    interface Route extends AppRouteMessages {}
  }
}
