import type { MenuNodeCallback, MenuNodeConfig } from '@go-tech/web-admin-layouts';

import { menuCategories } from './menu-category';

const adminTopLevelMenuNodes = [
  {
    id: 'admin-personnel-divider',
    menu: {
      order: 1,
      type: 'divider'
    }
  },
  {
    id: 'admin-developmentAndPerformance-divider',
    menu: {
      order: 3,
      type: 'divider'
    }
  },
  {
    id: 'admin-daily-divider',
    menu: {
      order: 5,
      type: 'divider'
    }
  },
  {
    id: 'admin-about-divider',
    menu: {
      order: 20,
      type: 'divider'
    }
  }
] satisfies MenuNodeConfig[];

export const menuNodeCallback: MenuNodeCallback = routeId => {
  if (routeId !== menuCategories.admin.layout) return [];

  return adminTopLevelMenuNodes;
};
