'use client';

import { Badge, Button, Card, CardContent, CardHeader, Separator, toast } from '@go-tech-frontend/ui';
import { ArrowLeft, CheckCircle, CreditCard, Download, Package, RefreshCw, Settings, XCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import Link from '@/app/components/Link';
import { OrderStatusEnum } from '@/app/constants/order';
import {
  type OrderAddResponse,
  PayTypeEnum,
  PayTypelabel,
  clearWebManagedCashier,
  openWebManagedCashier,
  peekWebManagedCashier,
  stashWebManagedCashier
} from '@/app/constants/payment';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { translateError } from '@/app/lib/translate-error';
import { useAuth } from '@/contexts/AuthContext';

// 线上支付回跳后轮询配置
const POLL_INTERVAL = 5000; // 每 5 秒查询一次
const POLL_MAX_ATTEMPTS = 60; // 最多 60 次（约 5 分钟）

/** 订单支付过期时间（分钟），超过此时间未支付的订单视为已过期 */
const ORDER_PAYMENT_TIMEOUT_MINUTES = 30;

const getStatusColor = (status: OrderStatusEnum) => {
  switch (status) {
    case OrderStatusEnum.COMPLETED:
      return 'bg-green-500/10 text-green-600 border-green-200';
    case OrderStatusEnum.PROCESSING:
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case OrderStatusEnum.WAIT_PAY:
      return 'bg-gray-500/10 text-gray-600 border-gray-200';
    case OrderStatusEnum.REJECT:
      return 'bg-red-500/10 text-red-600 border-red-200';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
};

/** 跳转第三方支付（全托管收银台）。 */
const goToThirdPartyPay = (data: OrderAddResponse) => {
  openWebManagedCashier(data);
  clearWebManagedCashier();
};

// oxlint-disable-next-line complexity
const OrderDetail = ({ detail, id: _orderId }: { detail: any; id: string }) => {
  const router = useRouter();
  const { token } = useAuth();
  const locale = useLocale();

  const [order, setOrder] = useState(detail);

  // i18n messages
  const fetchingPaymentInfo = useBatchTranslation('獲取支付信息中…');
  const redirectingToPay = useBatchTranslation('正在跳轉至支付頁面');
  const fetchPaymentInfoFailed = useBatchTranslation('獲取支付信息失敗');
  const fetchPaymentInfoRetry = useBatchTranslation('獲取支付信息失敗，請稍後重試');
  const cancellingOrder = useBatchTranslation('取消訂單中…');
  const orderCancelled = useBatchTranslation('訂單已取消');
  const orderCancelledStatus = useBatchTranslation('已取消');
  const cancelOrderFailed = useBatchTranslation('取消訂單失敗');
  const cancelOrderRetry = useBatchTranslation('取消訂單失敗，請稍後重試');
  const [isPolling, setIsPolling] = useState(false);
  const [pendingCashier, setPendingCashier] = useState<OrderAddResponse | null>(null);

  /** 线上支付下单后跳转到本页：先展示订单详情，短暂停留后再跳转第三方支付页面。 延迟跳转可让用户看到订单详情，并确保详情页已进入浏览历史（从支付页返回时回到详情而非下单页）。 */
  useEffect(() => {
    const data = peekWebManagedCashier(_orderId);
    if (!data) return;
    setPendingCashier(data);
    const timer = setTimeout(() => goToThirdPartyPay(data), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_orderId]);

  /**
   * 线上支付回跳后轮询订单状态。 仅当同时满足以下条件才开启轮询：
   *
   * 1. 回跳来源 from=kpay
   * 2. 支付方式为线上支付（payType=Online）
   * 3. 当前订单状态为待付款（WAIT_PAY） 一旦状态变更（支付成功/失败等）或达到最大次数即停止。
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 正在等待跳转第三方支付时不轮询
    if (peekWebManagedCashier(_orderId)) return;

    if (!token) return;

    const fromKpay = new URLSearchParams(window.location.search).get('from') === 'kpay';
    const shouldPoll =
      fromKpay && order?.payType === PayTypeEnum.Online && order?.orderStatus === OrderStatusEnum.WAIT_PAY;
    if (!shouldPoll) return;

    setIsPolling(true);
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/go-tech/platform/packageOrder/detail/${_orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Type': 'platform_customer',
            Authorization: `Bearer ${token}`
          }
        }).then(r => r.json());

        if (res.code === 200 && res.data && res.data.orderStatus !== OrderStatusEnum.WAIT_PAY) {
          // 状态已更新，保留服务端已过滤的套餐功能列表，刷新其余字段后停止轮询
          setOrder((prev: any) => ({ ...res.data, platformPackageDto: prev?.platformPackageDto }));
          clearInterval(timer);
          setIsPolling(false);
        }
      } catch (error) {
        console.error(error);
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        setIsPolling(false);
      }
    }, POLL_INTERVAL);

    return () => {
      clearInterval(timer);
      setIsPolling(false);
    };
  }, [token, _orderId, order?.payType, order?.orderStatus]);

  /** 判断订单是否已过支付有效期 */
  const isExpired = useMemo(() => {
    if (!order?.createTime) return false;
    const createTime = new Date(order.createTime).getTime();
    if (Number.isNaN(createTime)) return false;
    const now = Date.now();
    return now - createTime > ORDER_PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
  }, [order?.createTime]);

  /** 繼續付款：重新獲取支付參數並跳轉收銀台 */
  const handleContinuePay = async () => {
    if (!token) return;
    const toastId = toast.loading(fetchingPaymentInfo);
    try {
      const res = await fetch(`/go-tech/platform/packageOrder/repay/${_orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'platform_customer',
          Authorization: `Bearer ${token}`
        }
      }).then(r => r.json());

      if (res.code === 200 && res.data) {
        toast.success(redirectingToPay, { id: toastId });
        stashWebManagedCashier(res.data);
        goToThirdPartyPay(res.data);
      } else {
        toast.error((await translateError(res.message, locale)) || res.message || fetchPaymentInfoFailed, {
          id: toastId
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(fetchPaymentInfoRetry, { id: toastId });
    }
  };

  /** 取消訂單 */
  const handleCancelOrder = async () => {
    if (!token) return;
    const toastId = toast.loading(cancellingOrder);
    try {
      const res = await fetch(`/go-tech/platform/packageOrder/cancel/${_orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'platform_customer',
          Authorization: `Bearer ${token}`
        }
      }).then(r => r.json());

      if (res.code === 200) {
        toast.success(orderCancelled, { id: toastId });
        setOrder((prev: any) => ({
          ...prev,
          orderStatus: OrderStatusEnum.CANCELED,
          orderStatusName: orderCancelledStatus
        }));
      } else {
        toast.error((await translateError(res.message, locale)) || res.message || cancelOrderFailed, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error(cancelOrderRetry, { id: toastId });
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              <DynamicText text="訂單詳情" />
            </h1>
            <p className="text-muted-foreground mb-6">
              <DynamicText text="該訂單不存在或已被刪除" />
            </p>
            <Link href="/my-orders">
              <Button>
                <DynamicText text="返回我的訂單" />
              </Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.push('/my-orders')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <DynamicText text="返回我的訂單" />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                <DynamicText text="訂單詳情" />
              </h1>
              <p className="text-muted-foreground">
                <DynamicText text="訂單編號：" />
                {order.orderNo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPolling && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <DynamicText text="支付確認中…" />
                </span>
              )}
              <Badge className={`text-sm px-3 py-1 ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatusName}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Order Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 线上支付：下单成功，即将跳转第三方支付 */}
            {pendingCashier && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>
                      <DynamicText text="訂單已創建，即將跳轉至支付頁面…" />
                    </span>
                  </div>
                  <Button size="sm" onClick={() => goToThirdPartyPay(pendingCashier)}>
                    <DynamicText text="立即前往支付" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 套餐信息 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{order.packageName}</h2>
                    <p className="text-sm text-muted-foreground">
                      <DynamicText text={`最多可創建${order.platformPackageDto?.unitCount}個單位`} />
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <DynamicText text="包含功能" />
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {order.platformPackageDto?.packageItemList?.map((feature: any) => (
                    <div key={feature.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-[#FAEEEB]">
                      {feature.menuIcon && (
                        <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                          <use href={`#icon-${feature.menuIcon}`} xlinkHref={`#icon-${feature.menuIcon}`} />
                        </svg>
                      )}
                      <span className="text-sm">
                        <DynamicText text={feature.menuTitle} />
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 訂單明細 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">
                  <DynamicText text="訂單明細" />
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>
                    <DynamicText text={order.packageName} />
                  </span>
                  <span className="font-medium">{order.finalAmount} HKD</span>
                </div>

                {order.orderItems?.filter((item: any) => item.itemType !== 1)?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <DynamicText text="增值服務" />
                      </p>
                      {order.orderItems
                        ?.filter((item: any) => item.itemType !== 1)
                        ?.map((addon: any) => (
                          <div key={addon.id} className="flex justify-between items-center pl-4">
                            <span className="text-sm">
                              {addon.itemName} × {addon.count}
                              <span className="text-muted-foreground ml-2">
                                ({addon.price}/<DynamicText text="個" />)
                              </span>
                            </span>
                            <span className="font-medium">{addon.amount} HKD</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>
                    <DynamicText text="總計" />
                  </span>
                  <span className="text-primary">${order.finalAmount?.toLocaleString()} HKD</span>
                </div>
              </CardContent>
            </Card>

            {/* 付款信息 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">
                  <DynamicText text="付款信息" />
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <DynamicText text="付款方式" />
                      </span>
                      <span>{PayTypelabel[order.payType as PayTypeEnum] || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <DynamicText text="交易編號" />
                      </span>
                      <span className="font-mono text-xs">{order.transactionId || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <DynamicText text="下單日期" />
                      </span>
                      <span>{order.createTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <DynamicText text="到期日期" />
                      </span>
                      <span>{order.expireDate || '-'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 待付款訂單操作按鈕（未過期才顯示） */}
            {order.orderStatus === OrderStatusEnum.WAIT_PAY && !isExpired && (
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button variant="outline" className="gap-2" onClick={handleCancelOrder}>
                  <XCircle className="w-4 h-4" />
                  <DynamicText text="取消訂單" />
                </Button>
                <Button className="gap-2" onClick={handleContinuePay}>
                  <CreditCard className="w-4 h-4" />
                  <DynamicText text="繼續付款" />
                </Button>
              </div>
            )}

            {/* 操作按鈕 */}
            {order.orderStatus === OrderStatusEnum.COMPLETED && (
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button variant="outline" className="gap-2" onClick={() => router.push(`/invoice/${order.id}`)}>
                  <Download className="w-4 h-4" />
                  <DynamicText text="下載發票" />
                </Button>
                {order.isEffective && (
                  <>
                    {/* <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowAddonsDialog(true)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        購買增值服務
                      </Button> */}
                    <Link href={`/renew-order/${order.id}`}>
                      <Button className="gap-2 w-full sm:w-auto">
                        <RefreshCw className="w-4 h-4" />
                        <DynamicText text="續費套餐" />
                      </Button>
                    </Link>
                  </>
                )}
                {order.status === 'expired' && (
                  <Link href="/service-plan">
                    <Button className="gap-2 w-full sm:w-auto">
                      <DynamicText text="重新訂購" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OrderDetail;
