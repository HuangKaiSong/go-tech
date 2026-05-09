import { PayTypeEnum } from "./payment";

export enum OrderTypeEnum {
  /** 购买 */
  PURCHASE = 1,
  /** 续费 */
  RENEWAL = 2,
  /** 增值 */
  ADDITION = 3,
  /** 升级 */
  UPGRADE = 4,
}

export enum OrderItemTypeEnum {
  /** 套餐 */
  PACKAGE = 1,
  /** 增值服务 */
  ADDITION = 2,
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
  REJECT = 6,
}

export type OrderItemsType = {
  packageId?: string | number;
  itemType: OrderItemTypeEnum;
  itemName?: string;
  price: number;
  count?: number;
  itemCode?: string
  days?: number;
  amount?: number;
}

export type OrderInfoType = {
  orderType: OrderTypeEnum;
  payType: PayTypeEnum | null;
  invoiceHeader?: string;
  orderItems: OrderItemsType[]
}

export type PlatformPackageDto = {
  id: number;
  accountingSysPrice: number;
  addUnitPrice: number;
  custServiceSysPrice: number;
  rentSysPrice: number;
  venueSysPrice: number;
  price: number;
  packageName: string;
  unitCount: number;
  packageItemList: {
    level: number;
    menuTitle: string;
    menuIcon: string;
    menuId: number;
    packageId: number;
    id: number;
  }[]
}

export type OrderItemInfoType = {
  packageName: string;
  orderStatus: OrderStatusEnum;
  createTime: string;
  id: number;
  orderNo: string;
  payTime: string | null;
  expireDate: string | null;
  activateDate: string | null;
  discountRate: number;
  discountAmount: number;
  finalAmount: number;
  orderAmount: number;

  platformPackageDto: PlatformPackageDto;

  orderItems: OrderItemsType[]
} & OrderInfoType;