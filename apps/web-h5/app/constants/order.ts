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
  /** 已完成 */
  COMPLETED = 3,
  /** 取消 */
  CANCELED = 4,
  /** 拒絕 */
  REJECT = 5,
}