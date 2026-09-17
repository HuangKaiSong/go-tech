import { OrderStatusEnum, OrderTypeEnum } from '../constants/order';
import { PayTypeEnum } from '../constants/payment';

interface OrderActivationPollingState {
  fromKpay: boolean;
  orderStatus: OrderStatusEnum;
  payType: PayTypeEnum;
}

interface TenantSyncOrderState {
  orderStatus: OrderStatusEnum;
  orderType: OrderTypeEnum;
}

export function shouldPollOrderActivation({ fromKpay, orderStatus, payType }: OrderActivationPollingState) {
  if (!fromKpay || payType !== PayTypeEnum.Online) return false;

  return (
    orderStatus === OrderStatusEnum.WAIT_PAY ||
    orderStatus === OrderStatusEnum.PROCESSING ||
    orderStatus === OrderStatusEnum.ACTIVATION
  );
}

export function shouldSyncTenantsForOrder({ orderStatus, orderType }: TenantSyncOrderState) {
  return orderType === OrderTypeEnum.PURCHASE && orderStatus === OrderStatusEnum.COMPLETED;
}
