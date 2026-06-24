type Packages = {
  accountingSysPrice: number;
  addUnitPrice: number;
  custServiceSysPrice: number;
  id: number;
  packageItemList: { level: number; menuIcon: string; menuId: number; menuTitle: string }[];
  packageName: string;
  price: number;
  /** 90天价格 */
  priceA?: number;
  /** 180天价格 */
  priceB?: number;
  /** 365天价格 */
  priceC?: number;
  rentSysPrice: number;
  unitCount: number;
  venueSysPrice: number;
};

type Tenant = {
  /**
   * 租户ID
   *
   * @type {string}
   */
  tenantId: string;
  /**
   * 租户名称
   *
   * @type {string}
   */
  tenantName: string;
  [key: string]: any;
};
