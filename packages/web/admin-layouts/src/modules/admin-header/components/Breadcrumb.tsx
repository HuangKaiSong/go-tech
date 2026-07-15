import { I18nLabel, SvgIcon } from '@go-tech/web-ui-compose';
import { Link } from '@tanstack/react-router';
import { Breadcrumb as ABreadcrumb, type BreadcrumbProps } from 'antd';

import { getAdminLayoutsOptions } from '../../../setup';
import { useAdminMenus } from '../../../state/menus/use-admin-menus';

const itemRender: BreadcrumbProps['itemRender'] = (currentRoute, _, items) => {
  const isLast = currentRoute?.path === items[items.length - 1]?.path;
  // 分组节点(type: 'group')不提供 path,渲染成不可点击的纯文本
  const clickable = Boolean(currentRoute?.path) && !isLast;

  return clickable ? (
    <Link className="inline-flex! items-center whitespace-nowrap hover:text-base-text!" to={currentRoute.path}>
      {currentRoute.title}
    </Link>
  ) : (
    <div className="flex-y-center text-base-text">{currentRoute.title}</div>
  );
};

const AdminBreadcrumb = () => {
  const { activeMenu, currentMenu, getMenuInfoByPath, home, openKeys, selectedKey } = useAdminMenus();
  const { defaultIcon } = getAdminLayoutsOptions();

  const isHome = selectedKey[0] === home;

  const allBreadcrumb = [
    isHome ? null : home,
    ...openKeys,
    ...selectedKey,
    activeMenu ? currentMenu?.key : null
  ];

  const breadcrumb = allBreadcrumb
    .map(key => {
      if (!key) return null;

      const menuInfo = getMenuInfoByPath(key as Router.RoutePath);

      if (!menuInfo) return null;

      // 分组节点(type: 'group')不可点击,不提供导航 path
      const isGroup = menuInfo.menu?.type === 'group';

      return {
        title: (
          <>
            <SvgIcon
              className="text-icon mr-4px"
              icon={menuInfo.menu?.icon || defaultIcon}
              localIcon={menuInfo.menu?.localIcon}
            />
            <span>
              <I18nLabel fallback={menuInfo.title} i18nKey={menuInfo.i18nKey} />
            </span>
          </>
        ),
        path: isGroup ? undefined : menuInfo?.path
      };
    })
    .filter(Boolean) as BreadcrumbProps['items'];

  return <ABreadcrumb className="ml-12px" itemRender={itemRender} items={breadcrumb} />;
};

export default AdminBreadcrumb;
