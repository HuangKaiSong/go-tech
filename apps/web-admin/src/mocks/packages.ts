export interface PackageItem {
  id?: number;
  packageName: string;
  unitCount: number;
  price: number;
  addUnitPrice: number;
  rentSysPrice: number;
  venueSysPrice: number;
  accountingSysPrice: number;
  custServiceSysPrice: number;
  status: number;
  packageItemList: any[]
}
