'use client';

import { Button, Input, Label, Switch, type UploadedFile, toast } from '@go-tech-frontend/ui';
import { Result, Spin } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import { FileCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import valueAddedServices from '@/app/constants/addedServices';
import { type PromotionOption } from '@/app/constants/promotion';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { usePromotions } from '@/app/hooks/usePromotions';
import { translateError } from '@/app/lib/translate-error';
import servicePlanBg from '@/assets/service-plan-bg.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { needAddonsAtom, selectedMonthsAtom, selectedServicesAtom } from '@/contexts/Order.jotai';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { type OrderInfoType, OrderItemTypeEnum, OrderTypeEnum } from '../../constants/order';
import { DAYSPERMONTH, PayTypeEnum, stashWebManagedCashier } from '../../constants/payment';

const PaymentPanel = dynamic(() => import('../../components/payment/Panel'), {
  loading({ error, isLoading }) {
    if (isLoading) {
      return <Spin size="large" />;
    }
    if (error) {
      return <Result status="error" title="组件加载失败" subTitle="请重新操作" />;
    }
  },
  ssr: false
});
const PromotionPanel = dynamic(() => import('./PromotionPanel'), {
  loading({ error, isLoading }) {
    if (isLoading) {
      return <Spin size="large" />;
    }
    if (error) {
      return <Result status="error" title="组件加载失败" subTitle="请重新操作" />;
    }
  },
  ssr: false
});
const PriceSummary = dynamic(() => import('./PriceSummary'), {
  loading({ error, isLoading }) {
    if (isLoading) {
      return <Spin size="large" />;
    }
    if (error) {
      return <Result status="error" title="组件加载失败" subTitle="请重新操作" />;
    }
  },
  ssr: false
});

const ConfirmOrder = ({
  data,
  planId: planIdFromQuery,
  promotions = []
}: {
  data?: Packages;
  planId?: string;
  promotions?: PromotionOption[];
}) => {
  const router = useProgressRouter();
  const { planId } = { planId: planIdFromQuery };
  const { token, user } = useAuth();
  const locale = useLocale();

  const selectedPlan = data;
  const [hasMounted, setHasMounted] = useState(false);

  const [needAddons, _] = useAtom(needAddonsAtom);
  const [selectedServices, setSelectedServices] = useAtom(selectedServicesAtom);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // Customer info state
  // const [customerInfo, setCustomerInfo] = useState({
  //   name: user?.nickname,
  //   email: user?.sub,
  //   phone: '',
  //   company: ''
  // });
  const storedMonths = useAtomValue(selectedMonthsAtom);
  const [month, setMonth] = useState<number>(1);
  useEffect(() => {
    if (storedMonths) setMonth(storedMonths);
  }, [storedMonths]);

  const [needInvoice, setNeedInvoice] = useState<boolean>(true);
  const [invoiceName, setInvoiceName] = useState<string>(user?.nickname || '');

  // i18n messages
  const orderCreating = useBatchTranslation('创建订单中...');
  const orderCreated = useBatchTranslation('訂單創建成功');
  const evidenceSubmitted = useBatchTranslation('支付憑證已提交，我們將在確認後為您開通服務');
  const redirectingToCashier = useBatchTranslation('正在跳转至收银台');
  const addServiceOrderFailed = useBatchTranslation('創建增值服務訂單失敗，請稍後重試');
  const invoiceNamePlaceholder = useBatchTranslation('請輸入公司或個人名稱');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const selectedServicesSafe = hasMounted ? (selectedServices ?? {}) : {};

  const handleGoBack = () => {
    router.push(`/select-plan/${planId}`);
  };

  const handleConfirmPayment = () => {
    setShowPaymentDialog(true);
  };

  const getServiceUnitPrice = (serviceId: string) => {
    if (!selectedPlan) return 0;

    if (serviceId === 'rentSysPrice') return selectedPlan.rentSysPrice;
    if (serviceId === 'venueSysPrice') return selectedPlan.venueSysPrice;
    if (serviceId === 'accountingSysPrice') return selectedPlan.accountingSysPrice;
    if (serviceId === 'custServiceSysPrice') return selectedPlan.custServiceSysPrice;
    if (serviceId === 'addUnitPrice') return selectedPlan.addUnitPrice;

    return 0;
  };

  const addonsTotal = !needAddons
    ? 0
    : Object.entries(selectedServicesSafe).reduce(
        (sum, [serviceId, quantity]) => sum + getServiceUnitPrice(serviceId) * quantity,
        0
      ) * month;
  // @ts-ignore
  const originalPrice = (selectedPlan?.price * month || 0) + addonsTotal;

  /** 优惠价格 1个月-2个月 -> price 3个月-5个月 -> priceA 6个月-11个月 -> priceB 12个月及以上 -> priceC */
  const discount = useMemo<number>(() => {
    // 原价
    let recursePrice = selectedPlan?.price;
    if (month >= 12) {
      recursePrice = selectedPlan?.priceC || recursePrice;
    }
    if (month >= 6 && month < 12) {
      recursePrice = selectedPlan?.priceB || recursePrice;
    }
    if (month >= 3 && month < 6) {
      recursePrice = selectedPlan?.priceA || recursePrice;
    }

    const diffPrice = Math.max(0, (selectedPlan?.price || 0) - (recursePrice || 0)) * month;

    return Math.max(0, diffPrice);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [month, addonsTotal]);

  // ---------------------------------------------------------------------------
  // 优惠活动 / 优惠码
  // ---------------------------------------------------------------------------

  /** 优惠前的应付金额（套餐费 + 增值服务 - 时长折扣） */
  const promotionBaseAmount = Math.max(0, originalPrice - discount);

  const {
    applyingCode,
    availablePromotions,
    handleApplyCode,
    promotionCode,
    promotionDiscount,
    selectedPromotion,
    selectedPromotionId,
    setPromotionCode,
    setSelectedPromotionId
  } = usePromotions({ baseAmount: promotionBaseAmount, packageId: selectedPlan?.id, promotions, token, locale });

  const totalPrice = Math.max(0, originalPrice - discount - promotionDiscount);

  const requestHeaders = () =>
    new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Type': 'platform_customer'
    });

  /** 构建增值服务订单数据（FPS 与线上支付一致，仅 payType 不同） */
  const buildOrderInfo = (payType: PayTypeEnum) => {
    const orderInfo: any = {
      orderType: OrderTypeEnum.PURCHASE,
      payType,
      orderItems: [
        {
          packageId: selectedPlan?.id,
          itemType: OrderItemTypeEnum.PACKAGE,
          itemName: selectedPlan?.packageName,
          price: selectedPlan!.price!,
          count: month,
          days: month * DAYSPERMONTH
        }
      ]
    };
    if (needInvoice) {
      // 发票抬头
      orderInfo.invoiceHeader = invoiceName;
    }

    // 优惠活动 / 优惠码
    if (selectedPromotion) {
      orderInfo.promotionId = selectedPromotion.promotionId;
    }

    if (needAddons && selectedServices) {
      Object.entries(selectedServicesSafe).map(([serviceId, quantity]) => {
        const service = valueAddedServices.find(s => s.id === serviceId);
        if (!service) return null;
        const serviceTotalPrice = getServiceUnitPrice(serviceId);
        orderInfo.orderItems.push({
          itemType: OrderItemTypeEnum.ADDITION,
          count: quantity,
          price: serviceTotalPrice,
          packageId: selectedPlan?.id,
          itemName: service.name,
          // @ts-ignore
          itemCode: serviceId.replace('Price', '')
        });
        return null;
      });
    }
    return orderInfo;
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    toast.dismiss();
    const toastId = toast.loading(orderCreating);
    const orderInfo: OrderInfoType = buildOrderInfo(PayTypeEnum.FPS);
    const headers = requestHeaders();

    try {
      // 创建订单
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderInfo)
      })
        .then(res => res.json())
        .catch(err => {
          toast.dismiss();
          throw err;
        });
      if (orderResponse.code === 200) {
        toast.success(orderCreated, { id: toastId });
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          await fetch('/go-tech/platform/packageOrder/payEvidence', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id: orderId,
              payEvidence: voucherFile.url
            })
          })
            .catch(err => {
              throw err;
            })
            .then(res => res.json());

          router.push(`/my-orders/${orderId}`);
        }

        setShowPaymentDialog(false);
        // 下单成功后才清空已选增值服务，避免带入下一笔订单（刷新页面不应清空）
        setSelectedServices({});
        toast.success(evidenceSubmitted, { id: toastId });
      } else {
        toast.error((await translateError(orderResponse.message, locale)) || orderResponse.message, { id: toastId });
      }
    } catch (error) {
      toast.dismiss();
      console.log(error);
    }
  };

  /** 线上支付：先创建增值服务订单（payType=Online），再生成全托管收银台并跳转 */
  const handleOnlinePaymentConfirm = async () => {
    toast.dismiss();
    const toastId = toast.loading(orderCreating);
    const orderInfo = buildOrderInfo(PayTypeEnum.Online);

    try {
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify(orderInfo)
      }).then(res => res.json());

      if (orderResponse.code !== 200) {
        toast.error((await translateError(orderResponse.message, locale)) || orderResponse.message, { id: toastId });
        return;
      }

      // 后端返回 OrderAddResponse（含签名等参数），以 GET 表单方式喚起全托管收银台
      toast.success(redirectingToCashier, { id: toastId });
      setShowPaymentDialog(false);
      stashWebManagedCashier(orderResponse.data);
      router.push(`/my-orders/${orderResponse.data.orderId}`);
      // openWebManagedCashier(orderResponse.data);
    } catch (error) {
      console.log(error);
      toast.error(addServiceOrderFailed, { id: toastId });
    }
  };

  const handleBackToPaymentMethods = () => {
    setShowPaymentDialog(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-cover bg-center" style={{ backgroundImage: `url(${servicePlanBg})` }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            <DynamicText text="套餐確認" />
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-1" style={{ backgroundColor: '#FFF8F5' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Notice */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            <DynamicText text="! 為確保您的發票有效，請提供與貴公司營業登記相符的公司名稱，如需修改請點擊修改按鈕" />
          </p>

          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-gray-700">
                <DynamicText text="時長" />
              </h2>
            </div>

            <div className="flex flex-row items-center gap-2">
              <Input
                value={month}
                type="number"
                min={1}
                onChange={e => setMonth(Number(e.target.value))}
                className="h-9"
              />
              <div className="text-lg">
                <DynamicText text="月" />
              </div>
            </div>
          </div>

          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-700">
                    <DynamicText text={selectedPlan?.packageName as string} />{' '}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-700">${selectedPlan?.price?.toLocaleString()}</span>
                <span className="text-lg text-gray-700 ml-1" />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  <DynamicText text="套餐内容" />
                </span>
                <span className="text-sm text-gray-700">
                  <DynamicText text={`最多可創建${selectedPlan?.unitCount}個單位`} />
                </span>
              </div>

              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  <DynamicText text="包含功能" />
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan?.packageItemList?.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground"
                      style={{ backgroundColor: '#FAEEEB' }}
                    >
                      {feature.menuIcon && (
                        <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                          <use href={`#icon-${feature.menuIcon}`} xlinkHref={`#icon-${feature.menuIcon}`} />
                        </svg>
                      )}
                      <span>
                        <DynamicText text={feature.menuTitle} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value-Added Services Card */}
          {Object.keys(selectedServicesSafe).length > 0 && needAddons && (
            <div className="bg-white rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-bold text-gray-700">
                  <DynamicText text="增值服務" />
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedServicesSafe).map(([serviceId, quantity]) => {
                  const service = valueAddedServices.find(s => s.id === serviceId);
                  if (!service) return null;
                  const serviceTotalPrice = getServiceUnitPrice(serviceId) * quantity;
                  const subTotalPrice = serviceTotalPrice * month;

                  return (
                    <div
                      key={serviceId}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-gray-700">
                        <DynamicText text={service.name} />
                      </span>
                      <div className="flex items-center gap-8">
                        <span className="text-sm font-medium">${subTotalPrice}</span>
                        <span className="text-sm text-muted-foreground">
                          <DynamicText text="數量" /> {quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Promotion Card */}
          <PromotionPanel
            promotions={availablePromotions}
            selectedPromotionId={selectedPromotionId}
            onSelect={setSelectedPromotionId}
            baseAmount={promotionBaseAmount}
            code={promotionCode}
            onCodeChange={setPromotionCode}
            applying={applyingCode}
            onApply={handleApplyCode}
          />

          {/* Price Summary Card */}
          <PriceSummary
            originalPrice={originalPrice}
            durationDiscount={discount}
            promotionDiscount={promotionDiscount}
            totalPrice={totalPrice}
          />

          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-foreground">
                <DynamicText text="發票信息" />
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">
                  <DynamicText text="是否需要開具發票？" />
                </span>
              </div>
              <Switch checked={needInvoice} onCheckedChange={setNeedInvoice} />
            </div>
            {Boolean(needInvoice) && (
              <div className="mt-4 space-y-1">
                <Label className="text-sm text-muted-foreground">
                  <DynamicText text="發票抬頭（公司或個人名稱）" />
                </Label>
                <Input
                  value={invoiceName}
                  onChange={e => setInvoiceName(e.target.value)}
                  placeholder={invoiceNamePlaceholder}
                  className="h-9"
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="min-w-45 h-12 text-primary border-primary hover:bg-primary/5"
            >
              <DynamicText text="上一步" />
            </Button>
            <Button onClick={handleConfirmPayment} className="min-w-45 h-12">
              <DynamicText text="確認支付" />
            </Button>
          </div>
        </div>
      </section>

      {/* 支付弹框 */}
      <PaymentPanel
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        price={totalPrice}
        handleBackToPaymentMethods={handleBackToPaymentMethods}
        handleFpsPaymentConfirm={handleFpsPaymentConfirm}
        handleOnlinePaymentConfirm={handleOnlinePaymentConfirm}
      />

      <Footer />
    </div>
  );
};

export default ConfirmOrder;
