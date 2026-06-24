export interface PackageItem {
  level: number;
  menuIcon: string;
  menuId: number;
  menuTitle: string;
}

export interface Packages {
  accountingSysPrice: number;
  addUnitPrice: number;
  custServiceSysPrice: number;
  id: number;
  packageItemList: PackageItem[];
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
}
