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
  /** 首页/比较页标签，例如“最受欢迎” */
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

export interface PackageDetail extends PackageDisplayConfig {
  applyTo?: string;
  billingIntervalCount?: number;
  billingMode?: PackageBillingMode;
  dataCount?: number;
  menu?: PackageItem[];
  packageKind?: PackageKind;
  remind?: string;
  unitCount?: number;
}

export interface Packages {
  additionalItems?: PackageAddon[];
  bizCode?: PackageBizCode;
  capacityMetric?: PackageCapacityMetric;
  currency?: string;
  detail?: PackageDetail;
  displayConfig?: PackageDisplayConfig;
  displayFeatures?: string[];
  id: number;
  isFeatured?: boolean;
  itemName?: string;
  itemType?: number;
  note?: string;
  originalPrice?: number;
  overageStep?: number;
  packageCode?: string;
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
  sortOrder?: number;
  subtitle?: string;
}

export interface PackageAddon extends Omit<Partial<Packages>, 'additionalItems'> {
  itemName: string;
  itemType: number;
  price: number;
}
