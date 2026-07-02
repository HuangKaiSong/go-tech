export enum PayTypeEnum {
  /** FPS */
  FPS = 1,
  /** 线上支付（KPay 全托管收银台，聚合微信/支付宝等） */
  Online = 2,
  /** 微信支付（KPAY_ENABLE=false 时展示） */
  WechatPay = 3,
  /** 支付宝（KPAY_ENABLE=false 时展示） */
  Alipay = 4
}

/**
 * KPay 线上支付开关（客户端读取，需 NEXT_PUBLIC_ 前缀），默认 false。
 * - false：展示并启用 微信支付 / 支付宝（PayTypeEnum.WechatPay / Alipay）
 * - true： 展示并启用 线上支付（PayTypeEnum.Online，走 KPay 全托管收银台）
 *
 * 在各环境 .env 配置：NEXT_PUBLIC_KPAY_ENABLE=true|false
 */
export const KPAY_ENABLE = process.env.NEXT_PUBLIC_KPAY_ENABLE === 'true';

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
  [PayTypeEnum.Online]: '线上支付',
  [PayTypeEnum.WechatPay]: '微信',
  [PayTypeEnum.Alipay]: '支付宝'
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
const CASHIER_PENDING_KEY = 'KPAY_CASHIER_PENDING';

/**
 * 暂存待唤起的收银台数据。
 * 线上支付下单成功后调用，随后跳转到订单详情页；详情页挂载时再消费并跳转第三方支付。
 */
export function stashWebManagedCashier(data: OrderAddResponse): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CASHIER_PENDING_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('stashWebManagedCashier error:', error);
  }
}

/**
 * 读取暂存的收银台数据（仅当与当前订单匹配，不删除）。
 * 订单详情页挂载时调用：返回非空表示该订单需要跳转第三方支付。
 * 注意：读取后不删除，真正跳转前再调用 {@link clearWebManagedCashier}，
 * 以兼容 React 严格模式的 effect 双调用，并避免从支付页返回时重复跳转。
 */
export function peekWebManagedCashier(orderId: string | number): OrderAddResponse | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CASHIER_PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as OrderAddResponse;
    if (String(data.orderId) !== String(orderId)) return null;
    return data;
  } catch (error) {
    console.error('peekWebManagedCashier error:', error);
    return null;
  }
}

/** 清除暂存的收银台数据（跳转第三方支付前调用）。 */
export function clearWebManagedCashier(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(CASHIER_PENDING_KEY);
  } catch (error) {
    console.error('clearWebManagedCashier error:', error);
  }
}

export function openWebManagedCashier(data: OrderAddResponse): void {
  if (typeof document === 'undefined') return;

  const fields: Record<string, string> = {
    managedOrderNo: data.managedOrderNo,
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
