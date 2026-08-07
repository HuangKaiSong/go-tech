export interface PackageItem {
  accountingSysPrice?: number;
  addUnitPrice?: number;
  bizCode: 'hr' | 'pms';
  custServiceSysPrice?: number;
  id?: number;
  packageItemList: any[];
  packageName: string;
  price: number;
  rentSysPrice?: number;
  status: number;
  unitCount: number;
  venueSysPrice?: number;
}
