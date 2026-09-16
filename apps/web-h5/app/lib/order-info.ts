import type { Packages } from '@go-tech/types';
import { type OrderInfoType, OrderItemTypeEnum, type OrderItemsType, OrderTypeEnum } from '../constants/order';
import { DAYSPERMONTH, type PayTypeEnum } from '../constants/payment';
import { type ServiceSelection, getSelectedAddonLines } from './package-purchase';

type OrderSourceAdditionalService = {
  id?: number;
  itemName: string;
  packageCode?: string;
  price: number;
};

type OrderSourcePackage = {
  additionalItems?: readonly OrderSourceAdditionalService[];
  id: number;
  itemName?: string;
  packageCode?: string;
  price: number;
};

type OrderSource = {
  orderItems: readonly OrderItemsType[];
  orderNo: string;
  packageDetail: OrderSourcePackage | null;
};

type PurchaseOrderInfo = {
  invoiceHeader?: string;
  months: number;
  plan: Packages | undefined;
  promotionId?: number;
};

type AdditionOrderInfo = {
  order: OrderSource;
  promotionId?: number;
};

type UpgradeOrderInfo = AdditionOrderInfo & {
  availablePlans: readonly Packages[];
  selectedPlanCode: string | null;
};

type RenewalOrderInfo = {
  months: number;
  order: OrderSource;
  promotionId?: number;
};

export type BuildOrderInfoOptions =
  | {
      additionalServiceSelection: ServiceSelection;
      orderType: OrderTypeEnum.PURCHASE;
      otherOrderInfo: PurchaseOrderInfo;
      payType: PayTypeEnum;
    }
  | {
      additionalServiceSelection: ServiceSelection;
      orderType: OrderTypeEnum.ADDITION;
      otherOrderInfo: AdditionOrderInfo;
      payType: PayTypeEnum;
    }
  | {
      additionalServiceSelection: ServiceSelection;
      orderType: OrderTypeEnum.UPGRADE;
      otherOrderInfo: UpgradeOrderInfo;
      payType: PayTypeEnum;
    }
  | {
      orderType: OrderTypeEnum.RENEWAL;
      otherOrderInfo: RenewalOrderInfo;
      payType: PayTypeEnum;
    };

type CompleteOrderInfoOptions = {
  invoiceHeader?: string;
  orderItems: OrderItemsType[];
  orderType: OrderTypeEnum;
  originalOrder?: string;
  payType: PayTypeEnum;
  promotionId?: number;
};

const completeOrderInfo = ({
  invoiceHeader,
  orderItems,
  orderType,
  originalOrder,
  payType,
  promotionId
}: CompleteOrderInfoOptions): OrderInfoType => {
  const orderInfo: OrderInfoType = { orderItems, orderType, payType };
  if (invoiceHeader !== undefined) orderInfo.invoiceHeader = invoiceHeader;
  if (originalOrder !== undefined) orderInfo.originalOrder = originalOrder;
  if (promotionId !== undefined) orderInfo.promotionId = promotionId;
  return orderInfo;
};

const buildSelectedAdditionalItems = (order: OrderSource, selection: ServiceSelection): OrderItemsType[] => {
  const availableServices = order.packageDetail?.additionalItems ?? [];
  return Object.entries(selection).flatMap(([serviceId, count]) => {
    const service = availableServices.find(item => String(item.id) === serviceId);
    if (!service || service.id === undefined) return [];
    return [
      {
        count,
        itemName: service.itemName,
        itemType: OrderItemTypeEnum.ADDITION,
        packageCode: service.packageCode,
        packageId: order.packageDetail?.id,
        packageItemId: service.id,
        price: service.price
      }
    ];
  });
};

export const buildOrderInfo = (options: BuildOrderInfoOptions): OrderInfoType => {
  switch (options.orderType) {
    case OrderTypeEnum.PURCHASE: {
      const { invoiceHeader, months, plan, promotionId } = options.otherOrderInfo;
      if (!plan) throw new Error('未找到购买套餐');
      const additionalItems = getSelectedAddonLines(plan, options.additionalServiceSelection, months).map(
        ({ quantity, service }) => ({
          count: quantity,
          days: months * DAYSPERMONTH,
          itemCode: service.packageCode,
          itemName: service.itemName,
          itemType: OrderItemTypeEnum.ADDITION,
          packageCode: plan.packageCode,
          packageItemId: service.id,
          price: service.price
        })
      );
      return completeOrderInfo({
        invoiceHeader,
        orderItems: [
          {
            count: months,
            days: months * DAYSPERMONTH,
            itemName: plan.itemName,
            itemType: OrderItemTypeEnum.PACKAGE,
            packageCode: plan.packageCode,
            packageItemId: plan.id,
            price: plan.price
          },
          ...additionalItems
        ],
        orderType: options.orderType,
        payType: options.payType,
        promotionId
      });
    }

    case OrderTypeEnum.ADDITION: {
      const { order, promotionId } = options.otherOrderInfo;
      return completeOrderInfo({
        orderItems: buildSelectedAdditionalItems(order, options.additionalServiceSelection),
        orderType: options.orderType,
        originalOrder: order.orderNo,
        payType: options.payType,
        promotionId
      });
    }

    case OrderTypeEnum.UPGRADE: {
      const { availablePlans, order, promotionId, selectedPlanCode } = options.otherOrderInfo;
      const plan = availablePlans.find(item => item.packageCode === selectedPlanCode);
      if (!plan) throw new Error('未找到升级套餐');
      const orderPackageInfo = order.orderItems.find(item => item.itemType === OrderItemTypeEnum.PACKAGE);
      return completeOrderInfo({
        orderItems: [
          {
            count: orderPackageInfo?.count,
            days: orderPackageInfo?.days,
            itemName: plan.itemName,
            itemType: OrderItemTypeEnum.PACKAGE,
            packageCode: plan.packageCode,
            packageItemId: plan.id,
            price: plan.price
          },
          ...buildSelectedAdditionalItems(order, options.additionalServiceSelection)
        ],
        orderType: options.orderType,
        originalOrder: order.orderNo,
        payType: options.payType,
        promotionId
      });
    }

    case OrderTypeEnum.RENEWAL: {
      const { months, order, promotionId } = options.otherOrderInfo;
      const plan = order.packageDetail;
      if (!plan) throw new Error('未找到续费套餐');
      const additionalItems = order.orderItems
        .filter(item => item.itemType === OrderItemTypeEnum.ADDITION)
        .map(item => ({
          count: item.count,
          itemName: item.itemName,
          itemType: OrderItemTypeEnum.ADDITION,
          packageCode: plan.packageCode,
          packageItemId: item.id,
          price: item.price
        }));
      return completeOrderInfo({
        orderItems: [
          {
            count: months,
            days: months * DAYSPERMONTH,
            itemName: plan.itemName,
            itemType: OrderItemTypeEnum.PACKAGE,
            packageCode: plan.packageCode,
            packageItemId: plan.id,
            price: plan.price
          },
          ...additionalItems
        ],
        orderType: options.orderType,
        originalOrder: order.orderNo,
        payType: options.payType,
        promotionId
      });
    }

    default:
      throw new Error('不支持的订单类型');
  }
};
