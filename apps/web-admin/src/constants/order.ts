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

export const OrderTypeLabel: Record<OrderTypeEnum, string> = {
  [OrderTypeEnum.PURCHASE]: '新買',
  [OrderTypeEnum.RENEWAL]: '續費',
  [OrderTypeEnum.ADDITION]: '增值',
  [OrderTypeEnum.UPGRADE]: '升級'
};

export enum OrderItemTypeEnum {
  /** 套餐 */
  PACKAGE = 1,
  /** 增值服务 */
  ADDITION = 2
}

export const OrderItemTypeLabel: Record<OrderItemTypeEnum, string> = {
  [OrderItemTypeEnum.PACKAGE]: '套餐',
  [OrderItemTypeEnum.ADDITION]: '增值服务'
};

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

export const OrderStatusLabel: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.WAIT_PAY]: '待付款',
  [OrderStatusEnum.PROCESSING]: '待確認',
  [OrderStatusEnum.ACTIVATION]: '待開通',
  [OrderStatusEnum.CANCELED]: '已取消',
  [OrderStatusEnum.COMPLETED]: '已完成',
  [OrderStatusEnum.REJECT]: '已拒絕'
};
