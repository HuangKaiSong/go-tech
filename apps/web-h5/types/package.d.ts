type Packages = {
  id: number;
  packageName: string;
  unitCount: number;
  price: number;
  addUnitPrice: number;
  rentSysPrice: number;
  venueSysPrice: number;
  accountingSysPrice: number;
  custServiceSysPrice: number;
  packageItemList: { menuId: number; menuIcon: string; menuTitle: string, level: number }[];
};

type Tenant = {
  /**
   * 租户ID
   * @type {string}
   */
  tenantId: string;
  /**
   * 租户名称
   * @type {string}
   */
  tenantName: string;
  [key: string]: any
}