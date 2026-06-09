type Packages = {
  id: number;
  packageName: string;
  unitCount: number;
  price: number;
  /** 90天价格 */
  priceA?: number;
  /** 180天价格 */
  priceB?: number;
  /** 365天价格 */
  priceC?: number;
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