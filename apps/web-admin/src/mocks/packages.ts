export interface PackageItem {
  id: string;
  orderNo: string;
  packageName: string;
  maxUnits: number;
  packagePrice: number;
  extraUnitPrice: number;
  rentalSystemPrice: number;
  facilitySystemPrice: number;
  accountingSystemPrice: number;
  customerServicePrice: number;
  status: boolean;
}

export const mockPackages: PackageItem[] = [
  {
    id: "1",
    orderNo: "TC000001",
    packageName: "黃金套餐",
    maxUnits: 25,
    packagePrice: 1000,
    extraUnitPrice: 80,
    rentalSystemPrice: 20,
    facilitySystemPrice: 20,
    accountingSystemPrice: 50,
    customerServicePrice: 20,
    status: true,
  },
  {
    id: "2",
    orderNo: "TC000002",
    packageName: "白金套餐",
    maxUnits: 100,
    packagePrice: 3200,
    extraUnitPrice: 50,
    rentalSystemPrice: 15,
    facilitySystemPrice: 15,
    accountingSystemPrice: 25,
    customerServicePrice: 20,
    status: false,
  },
  {
    id: "3",
    orderNo: "TC000003",
    packageName: "鑽石套餐",
    maxUnits: 400,
    packagePrice: 12000,
    extraUnitPrice: 30,
    rentalSystemPrice: 10,
    facilitySystemPrice: 10,
    accountingSystemPrice: 15,
    customerServicePrice: 20,
    status: true,
  },
  {
    id: "4",
    orderNo: "TC000004",
    packageName: "黃金套餐",
    maxUnits: 25,
    packagePrice: 1000,
    extraUnitPrice: 80,
    rentalSystemPrice: 20,
    facilitySystemPrice: 20,
    accountingSystemPrice: 50,
    customerServicePrice: 20,
    status: false,
  },
  {
    id: "5",
    orderNo: "TC000005",
    packageName: "白金套餐",
    maxUnits: 25,
    packagePrice: 1000,
    extraUnitPrice: 80,
    rentalSystemPrice: 20,
    facilitySystemPrice: 20,
    accountingSystemPrice: 50,
    customerServicePrice: 20,
    status: true,
  },
  {
    id: "6",
    orderNo: "TC000006",
    packageName: "黃金套餐",
    maxUnits: 25,
    packagePrice: 1000,
    extraUnitPrice: 80,
    rentalSystemPrice: 20,
    facilitySystemPrice: 20,
    accountingSystemPrice: 50,
    customerServicePrice: 20,
    status: false,
  },
  {
    id: "7",
    orderNo: "TC000007",
    packageName: "黃金套餐",
    maxUnits: 25,
    packagePrice: 1000,
    extraUnitPrice: 80,
    rentalSystemPrice: 20,
    facilitySystemPrice: 20,
    accountingSystemPrice: 50,
    customerServicePrice: 20,
    status: false,
  },
];