import type { PackageDetail } from '@go-tech/types';
import type { OrderItemTypeEnum, OrderStatusEnum, OrderTypeEnum } from './order';
import type { PayTypeEnum } from './payment';

export interface OrderPackageMenu {
  level: number;
  menuIcon?: string;
  menuId: number;
  menuTitle: string;
  parentId: number | null;
}

export interface OrderPackageDetail extends Omit<PackageDetail, 'menu'> {
  menu?: OrderPackageMenu[];
}

export interface OrderPackageItem {
  bizCode: string;
  createTime: string;
  createUser: number;
  detail: OrderPackageDetail;
  id: number;
  itemName: string;
  packageCode: string;
  packageName: string;
  price: number;
  priceA: number | null;
  priceB: number | null;
  priceC: number | null;
  status: number;
}

export interface OrderAdditionalItem extends OrderPackageItem {
  /** 功能配置类型：菜单、数量或两者；不同于订单条目的 itemType。 */
  itemType: 1 | 2 | 3;
}

export interface OrderPackage extends OrderPackageItem {
  additionalItems: OrderAdditionalItem[];
}

export interface OrderResponseItem {
  amount: number;
  count: number;
  days: number;
  id: number;
  itemName: string;
  itemType: OrderItemTypeEnum;
  orderId: number;
  packageCode: string;
  packageItemId: number;
  /** 当前响应为 null，非空快照结构尚未约定。 */
  packageSnapshot: unknown;
  price: number;
}

/** PackageOrder/myOrders 的返回对象，与创建订单的请求字段分别定义。 */
export interface MyOrder {
  activateDate: string | null;
  bizCode: string;
  businessRegNo: string | null;
  createTime: string;
  createUser: number;
  custCode: string;
  custEmail: string;
  custName: string;
  custPhone: string;
  discountAmount: number;
  discountRate: number;
  expireDate: string | null;
  finalAmount: number;
  id: number;
  invoiceHeader: string | null;
  invoiceNo: string | null;
  isEffective: boolean;
  orderAmount: number;
  orderItems: OrderResponseItem[];
  orderNo: string;
  orderStatus: OrderStatusEnum;
  orderStatusName: string;
  orderType: OrderTypeEnum;
  originalOrder: string | null;
  packageDetail: OrderPackage | null;
  packageName: string;
  payEvidence: string | null;
  payOrderNo: string | null;
  payTime: string | null;
  payType: PayTypeEnum;
  promotionId: number | null;
  residualAmount: number;
  tenantId: number | null;
}

export interface MyOrdersResponse {
  code: number;
  data: MyOrder[] | null;
  message: string;
}
