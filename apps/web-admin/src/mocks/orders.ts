import type { PackageBizCode } from '@go-tech/types';
import { OrderTypeEnum } from '@/constants/order';
import { PayTypeEnum } from '@/constants/payment';

export interface Order {
  createTime: string;
  createUser: number;
  custCode: string;
  custEmail: string;
  custName: string;
  custPhone: string;
  discountAmount: number;
  discountRate: number;
  finalAmount: number;
  id: number;
  orderAmount: number;
  orderItems?: any;
  orderNo: string;
  orderStatus: number;
  orderType: OrderTypeEnum;
  originalOrder?: any;
  packageName: string;
  payEvidence: string;
  payTime?: string;
  payType: PayTypeEnum;
}

export interface OrderDetail {
  bizCode: PackageBizCode;
  createTime: string;
  createUser: number;
  custCode: string;
  custEmail: string;
  custName: string;
  custPhone: string;
  discountAmount: number;
  discountRate: number;
  finalAmount: number;
  id: number;
  orderAmount: number;
  orderItems: {
    amount: number;
    count: number;
    id: number;
    itemName: string;
    itemType: number;
    orderId: number;
    packageId: number;
    price: number;
  }[];
  orderNo: string;
  orderStatus: number;
  orderType: OrderTypeEnum;
  originalOrder: null;
  packageDetail: {
    detail: {
      dataCount: number;
    };
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
    status: number;
  };
  payEvidence: string;
  payTime: PayTypeEnum;
  payType: number;
}
