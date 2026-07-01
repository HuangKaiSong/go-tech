export enum PayTypeEnum {
  /** FPS */
  FPS = 1,
  // /** Wechat Pay */
  // WechatPay = 2,
  // /** Alipay */
  // Alipay = 3
  /** 线上支付（KPay 全托管收银台，聚合微信/支付宝等） */
  Online = 2
}

export const PayTypelabel: Record<PayTypeEnum, string> = {
  [PayTypeEnum.FPS]: 'FPS',
  // [PayTypeEnum.WechatPay]: '微信',
  // [PayTypeEnum.Alipay]: '支付宝'
  [PayTypeEnum.Online]: '线上支付'
};
