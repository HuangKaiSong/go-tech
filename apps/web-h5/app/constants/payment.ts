export enum PayTypeEnum {
  /** FPS */
  FPS = 1,
  /** Wechat Pay */
  WechatPay = 2,
  /** Alipay */
  Alipay = 3,
}

// 每月固定30天
export const DAYSPERMONTH = 30;

export const PayTypelabel: Record<PayTypeEnum, string> = {
  [PayTypeEnum.FPS]: "FPS",
  [PayTypeEnum.WechatPay]: "微信",
  [PayTypeEnum.Alipay]: "支付宝",
};