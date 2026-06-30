export enum PayTypeEnum {
  /** FPS */
  FPS = 1,
  // /** Wechat Pay */
  // WechatPay = 2,
  // /** Alipay */
  // Alipay = 3,
  /** 线上支付（KPay 全托管收银台，聚合微信/支付宝等） */
  Online = 2
}

export interface OrderAddResponse {
  /**
   * 语言
   */
  language: string;
  /**
   * 支付订单号（支付平台）
   */
  managedOrderNo: string;
  /**
   * 商户号
   */
  merchantCode: string;
  /**
   * 32位随机码
   */
  nonceStr: string;
  /**
   * 订单ID
   */
  orderId: number;
  /**
   * 签名
   */
  signature: string;
  /**
   * 时间戳
   */
  timestamp: string;
}

// 每月固定30天
export const DAYSPERMONTH = 30;

export const PayTypelabel: Record<PayTypeEnum, string> = {
  [PayTypeEnum.FPS]: 'FPS',
  // [PayTypeEnum.WechatPay]: '微信',
  // [PayTypeEnum.Alipay]: '支付宝',
  [PayTypeEnum.Online]: '线上支付'
};

/**
 * KPay 全托管收银台 Web 收银台地址（喚起 Web 收银台 GET /v1/web/managed/order）。
 * 通过环境变量区分 UAT / 生产，未配置时默认 UAT。
 *
 * TODO: 在各环境 .env 配置 NEXT_PUBLIC_KPAY_CASHIER_URL：
 *   PROD: https://payment.kpay-group.com/v1/web/managed/order
 *   UAT:  https://payment.uat.kpay-group.com/v1/web/managed/order
 */
export const KPAY_WEB_MANAGED_CASHIER_URL =
  process.env.NEXT_PUBLIC_KPAY_CASHIER_URL ?? 'https://payment.uat.kpay-group.com/v1/web/managed/order';

/**
 * 喚起 KPay 全托管收银台（Web 收银台）。
 *
 * 业务订单创建成功后（payType=Online），后端返回 {@link OrderAddResponse}（含签名等参数）。
 * 这里按 KPay 文档以自动提交的 GET 表单方式跳转到收银台，无需再请求后端生成收银台。
 * 支付完成后 KPay 会按下单时设置的 returnUrl 跳回；最终结果以后端 webhook 落库的订单状态为准。
 */
export function openWebManagedCashier(data: OrderAddResponse): void {
  if (typeof document === 'undefined') return;

  const fields: Record<string, string> = {
    orderNo: data.managedOrderNo,
    language: data.language,
    'K-Merchant-Code': data.merchantCode,
    'K-Nonce-Str': data.nonceStr,
    'K-Timestamp': String(data.timestamp),
    'K-Signature': data.signature
  };

  const form = document.createElement('form');
  form.method = 'get';
  form.action = KPAY_WEB_MANAGED_CASHIER_URL;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value ?? '';
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
