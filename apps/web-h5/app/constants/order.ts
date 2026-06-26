import { PayTypeEnum } from './payment';

export enum OrderTypeEnum {
  /** 购买 */
  PURCHASE = 1,
  /** 续费 */
  RENEWAL = 2,
  /** 增值 */
  ADDITION = 3,
  /** 升级 */
  UPGRADE = 4
}

export enum OrderItemTypeEnum {
  /** 套餐 */
  PACKAGE = 1,
  /** 增值服务 */
  ADDITION = 2
}

// 订单状态（1 - 待确认，2 - 待付款，3 - 已完成，4 - 已取消, 5 - 拒絕）
export enum OrderStatusEnum {
  /** 待支付 */
  WAIT_PAY = 2,
  /** 待确认 */
  PROCESSING = 1,
  /** 待開通 */
  ACTIVATION = 3,
  /** 已完成 */
  COMPLETED = 4,
  /** 取消 */
  CANCELED = 5,
  /** 拒绝 */
  REJECT = 6
}

export type OrderItemsType = {
  amount?: number;
  count?: number;
  days?: number;
  itemCode?: string;
  itemName?: string;
  itemType: OrderItemTypeEnum;
  packageId?: string | number;
  price: number;
};

export type OrderInfoType = {
  invoiceHeader?: string;
  orderItems: OrderItemsType[];
  orderType: OrderTypeEnum;
  payType: PayTypeEnum | null;
  promotionId?: number;
};

export type PlatformPackageDto = {
  accountingSysPrice: number;
  addUnitPrice: number;
  custServiceSysPrice: number;
  id: number;
  packageItemList: {
    id: number;
    level: number;
    menuIcon: string;
    menuId: number;
    menuTitle: string;
    packageId: number;
  }[];
  packageName: string;
  price: number;
  priceA?: number;
  priceB?: number;
  priceC?: number;
  rentSysPrice: number;
  unitCount: number;
  venueSysPrice: number;
};

export type OrderItemInfoType = {
  activateDate: string | null;
  createTime: string;
  discountAmount: number;
  discountRate: number;
  expireDate: string | null;
  finalAmount: number;
  id: number;
  isEffective: boolean;
  orderAmount: number;
  orderItems: OrderItemsType[];
  orderNo: string;
  orderStatus: OrderStatusEnum;
  orderStatusName: string;
  packageName: string;

  payTime: string | null;

  platformPackageDto: PlatformPackageDto;
} & OrderInfoType;
