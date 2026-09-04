export interface PackageItem {
  isHighlight?: boolean;
  level: number;
  menuIcon: string;
  menuId: number;
  menuTitle: string;
  sortOrder?: number;
}

export type PackageBillingMode = 'employee_month' | 'month' | 'unit_month' | 'year';
export type PackageBizCode = 'hr' | 'pms';
export type PackageCapacityMetric = 'employee' | 'property' | 'unit';
export type PackageKind = 'addon' | 'plan';

export interface PackageDisplayConfig {
  badge?: string;
  billingLabel?: string;
  capacityLabel?: string;
  features?: string[];
  isFeatured?: boolean;
  isRecommended?: boolean;
  note?: string;
  originalPrice?: number;
  subtitle?: string;
  summary?: string;
}

export interface Packages {
  accountingSysPrice: number;
  addonCode?: string;
  addUnitPrice: number;
  /** 首页/比较页标签，例如“最受欢迎” */
  badge?: string;
  billingIntervalCount?: number;
  billingMode?: PackageBillingMode;
  bizCode?: PackageBizCode;
  capacityMetric?: PackageCapacityMetric;
  currency?: string;
  custServiceSysPrice: number;
  displayConfig?: PackageDisplayConfig;
  /** 可选的首页核心卖点；未提供时使用 packageItemList */
  displayFeatures?: string[];
  id: number;
  isFeatured?: boolean;
  isRecommended?: boolean;
  note?: string;
  originalPrice?: number;
  overageStep?: number;
  packageCode?: string;
  packageItemList: PackageItem[];
  packageKind?: PackageKind;
  packageName: string;
  parentId?: number | null;
  price: number;
  /** 90天价格 */
  priceA?: number;
  /** 180天价格 */
  priceB?: number;
  /** 365天价格 */
  priceC?: number;
  purchaseEnabled?: boolean;
  rentSysPrice: number;
  sortOrder?: number;
  subtitle?: string;
  summary?: string;
  unitCount: number;
  venueSysPrice: number;
}
