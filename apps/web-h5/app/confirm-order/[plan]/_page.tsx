'use client';

import { Button, Input, Label, Switch, type UploadedFile, toast } from '@go-tech-frontend/ui';
import { useSessionStorageState } from 'ahooks';
import { FileCheck } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import valueAddedServices from '@/app/constants/addedServices';
import { type PromotionOption, getPromotionDiscount } from '@/app/constants/promotion';
import { usePromotions } from '@/app/hooks/usePromotions';
import servicePlanBg from '@/assets/service-plan-bg.jpg';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { type OrderInfoType, OrderItemTypeEnum, OrderTypeEnum } from '../../constants/order';
import { DAYSPERMONTH, PayTypeEnum, openWebManagedCashier } from '../../constants/payment';
const PaymentPanel = dynamic(() => import('../../components/payment/Panel'), {
  ssr: false
});

interface PromotionPanelProps {
  applying: boolean;
  baseAmount: number;
  code: string;
  onApply: () => void;
  onCodeChange: (value: string) => void;
  onSelect: (id: number | null) => void;
  promotions: PromotionOption[];
  selectedPromotionId: number | null;
}

/** 优惠活动选择 + 优惠码输入（H5 主题样式） */
const PromotionPanel = ({
  applying,
  baseAmount,
  code,
  onApply,
  onCodeChange,
  onSelect,
  promotions,
  selectedPromotionId
}: PromotionPanelProps) => {
  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h3 className="text-lg font-bold text-gray-700">優惠活動</h3>
      </div>

      {promotions.length > 0 ? (
        <div className="space-y-3">
          {promotions.map(promotion => {
            const isSelected = selectedPromotionId === promotion.promotionId;
            const amount = getPromotionDiscount(promotion, baseAmount);
            return (
              <label
                key={promotion.promotionId}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="promotion"
                    checked={isSelected}
                    onChange={() => onSelect(promotion.promotionId)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{promotion.promotionName}</p>
                    {promotion.promotionDesc && (
                      <p className="text-xs text-muted-foreground">{promotion.promotionDesc}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-primary shrink-0">-${amount.toLocaleString()} HKD</span>
              </label>
            );
          })}
          <label
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedPromotionId === null ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              type="radio"
              name="promotion"
              checked={selectedPromotionId === null}
              onChange={() => onSelect(null)}
              className="w-4 h-4 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">不使用優惠</span>
          </label>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">該套餐暫無可用優惠活動</p>
      )}

      {/* 优惠码 */}
      <div className="mt-4 flex items-center gap-2">
        <Input
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          placeholder="輸入優惠碼"
          className="h-10 flex-1"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onApply();
            }
          }}
        />
        <Button
          variant="outline"
          className="h-10 text-primary border-primary hover:bg-primary/5"
          disabled={applying}
          onClick={onApply}
        >
          {applying ? '驗證中...' : '使用優惠碼'}
        </Button>
      </div>
    </div>
  );
};

interface PriceSummaryProps {
  durationDiscount: number;
  originalPrice: number;
  promotionDiscount: number;
  totalPrice: number;
}

/** 費用匯總卡片：原價 / 時長優惠 / 活動優惠 / 總計 */
const PriceSummary = ({ durationDiscount, originalPrice, promotionDiscount, totalPrice }: PriceSummaryProps) => {
  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <div className="flex flex-wrap items-center gap-8">
          <span className="text-lg font-bold text-gray-700">
            原價：
            <span className="line-through">${originalPrice?.toLocaleString()}HKD</span>
          </span>
          {durationDiscount > 0 && (
            <span className="text-lg font-medium text-gray-700">
              時長優惠：
              <span className="text-primary">${durationDiscount.toLocaleString()}HKD</span>
            </span>
          )}
          {promotionDiscount > 0 && (
            <span className="text-lg font-medium text-gray-700">
              活動優惠：
              <span className="text-primary">${promotionDiscount.toLocaleString()}HKD</span>
            </span>
          )}
          <span className="text-lg font-bold">
            總計：
            <span className="text-2xl text-primary">${totalPrice.toLocaleString()} HKD</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const ConfirmOrder = ({
  data,
  planId: planIdFromQuery,
  promotions = []
}: {
  data?: Packages;
  planId?: string;
  promotions?: PromotionOption[];
}) => {
  const router = useRouter();
  const { planId } = { planId: planIdFromQuery };
  const { token, user } = useAuth();

  const selectedPlan = data;
  const [hasMounted, setHasMounted] = useState(false);

  const [selectedServices, setSelectedServices] = useSessionStorageState<Record<string, number>>(
    'user-selected-services',
    {
      defaultValue: () => ({}),
      listenStorageChange: true
    }
  );

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // Customer info state
  // const [customerInfo, setCustomerInfo] = useState({
  //   name: user?.nickname,
  //   email: user?.sub,
  //   phone: '',
  //   company: ''
  // });
  const [storedMonths] = useSessionStorageState<number>('user-selected-months', { defaultValue: 1 });
  const [month, setMonth] = useState<number>(1);
  useEffect(() => {
    if (storedMonths) setMonth(storedMonths);
  }, [storedMonths]);

  const [needInvoice, setNeedInvoice] = useState<boolean>(true);
  const [invoiceName, setInvoiceName] = useState<string>(user?.nickname || '');

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

  const addonsTotal =
    Object.entries(selectedServicesSafe).reduce(
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
  } = usePromotions({ baseAmount: promotionBaseAmount, packageId: selectedPlan?.id, promotions, token });

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

    if (selectedServices) {
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
    const toastId = toast.loading('创建订单中...');
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
        toast.success('訂單創建成功', { id: toastId });
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
        toast.success('支付憑證已提交，我們將在確認後為您開通服務', { id: toastId });
      } else {
        toast.error(orderResponse.message, { id: toastId });
      }
    } catch (error) {
      toast.dismiss();
      console.log(error);
    }
  };

  /** 线上支付：先创建增值服务订单（payType=Online），再生成全托管收银台并跳转 */
  const handleOnlinePaymentConfirm = async () => {
    toast.dismiss();
    const toastId = toast.loading('创建订单中...');
    const orderInfo = buildOrderInfo(PayTypeEnum.Online);

    try {
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify(orderInfo)
      }).then(res => res.json());

      if (orderResponse.code !== 200) {
        toast.error(orderResponse.message, { id: toastId });
        return;
      }

      // 后端返回 OrderAddResponse（含签名等参数），以 GET 表单方式喚起全托管收银台
      toast.success('正在跳转至收银台', { id: toastId });
      setShowPaymentDialog(false);
      openWebManagedCashier(orderResponse.data);
    } catch (error) {
      console.log(error);
      toast.error('創建增值服務訂單失敗，請稍後重試', { id: toastId });
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
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">套餐確認</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-1" style={{ backgroundColor: '#FFF8F5' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Notice */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            ! 為確保您的發票有效，請提供與貴公司營業登記相符的公司名稱，如需修改請點擊修改按鈕
          </p>

          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-gray-700">時長</h2>
            </div>

            <div className="flex flex-row items-center gap-2">
              <Input
                value={month}
                type="number"
                min={1}
                onChange={e => setMonth(Number(e.target.value))}
                className="h-9"
              />
              <div className="text-lg">月</div>
            </div>
          </div>

          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-700">{selectedPlan?.packageName}</h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-700">${selectedPlan?.price?.toLocaleString()}</span>
                <span className="text-lg text-gray-700 ml-1" />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">套餐内容</span>
                <span className="text-sm text-gray-700">最多可創建{selectedPlan?.unitCount}個單位</span>
              </div>

              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">包含功能</span>
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
                      <span>{feature.menuTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value-Added Services Card */}
          {Object.keys(selectedServicesSafe).length > 0 && (
            <div className="bg-white rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-bold text-gray-700">增值服務</h3>
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
                      <span className="text-sm text-gray-700">{service.name}</span>
                      <div className="flex items-center gap-8">
                        <span className="text-sm font-medium">${subTotalPrice}</span>
                        <span className="text-sm text-muted-foreground">數量 {quantity}</span>
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
              <h2 className="text-lg font-bold text-foreground">發票信息</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">是否需要開具發票？</span>
              </div>
              <Switch checked={needInvoice} onCheckedChange={setNeedInvoice} />
            </div>
            {needInvoice && (
              <div className="mt-4 space-y-1">
                <Label className="text-sm text-muted-foreground">發票抬頭（公司或個人名稱）</Label>
                <Input
                  value={invoiceName}
                  onChange={e => setInvoiceName(e.target.value)}
                  placeholder="請輸入公司或個人名稱"
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
              上一步
            </Button>
            <Button onClick={handleConfirmPayment} className="min-w-45 h-12">
              確認支付
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
