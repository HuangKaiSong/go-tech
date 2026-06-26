'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  type UploadedFile,
  toast
} from '@go-tech-frontend/ui';
import dayjs from 'dayjs';
import { ArrowLeft, CheckCircle, Clock, CreditCard, Package, RefreshCw, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import Link from '@/app/components/Link';
import Fps from '@/app/components/payment/Fps';
import { type OrderItemInfoType, OrderItemTypeEnum, OrderTypeEnum } from '@/app/constants/order';
import { DAYSPERMONTH, PayTypeEnum } from '@/app/constants/payment';
import { type PromotionOption, getPromotionDiscount, toArray } from '@/app/constants/promotion';
import { useAuth } from '@/contexts/AuthContext';

const renewalOptions = [
  { id: '1month', label: '續費1个月', months: 1, discount: 0 },
  { id: '2month', label: '續費2个月', months: 2, discount: 0 },
  { id: '3month', label: '續費3个月', months: 3, discount: 0 },
  { id: 'custom', label: '自定义月数', months: 6, discount: 0 }
];

interface RenewPromotionCardProps {
  applying: boolean;
  baseAmount: number;
  code: string;
  onApply: () => void;
  onCodeChange: (value: string) => void;
  onSelect: (id: number | null) => void;
  promotions: PromotionOption[];
  selectedPromotionId: number | null;
}

/** 优惠活动选择 + 优惠码输入（续费页 Card 主题样式） */
const RenewPromotionCard = ({
  applying,
  baseAmount,
  code,
  onApply,
  onCodeChange,
  onSelect,
  promotions,
  selectedPromotionId
}: RenewPromotionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold">優惠活動</h2>
      </CardHeader>
      <CardContent>
        {promotions.length > 0 ? (
          <RadioGroup
            value={selectedPromotionId === null ? 'none' : String(selectedPromotionId)}
            onValueChange={value => onSelect(value === 'none' ? null : Number(value))}
            className="space-y-3"
          >
            {promotions.map(promotion => {
              const amount = getPromotionDiscount(promotion, baseAmount);
              const active = selectedPromotionId === promotion.promotionId;
              return (
                <div
                  key={promotion.promotionId}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelect(promotion.promotionId)}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={String(promotion.promotionId)} id={`promo-${promotion.promotionId}`} />
                    <Label htmlFor={`promo-${promotion.promotionId}`} className="cursor-pointer">
                      <span className="font-medium">{promotion.promotionName}</span>
                      {promotion.promotionDesc && (
                        <span className="block text-xs text-muted-foreground">{promotion.promotionDesc}</span>
                      )}
                    </Label>
                  </div>
                  <span className="font-medium text-primary">-${amount.toLocaleString()}</span>
                </div>
              );
            })}
            <div
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPromotionId === null ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelect(null)}
            >
              <RadioGroupItem value="none" id="promo-none" />
              <Label htmlFor="promo-none" className="cursor-pointer">
                不使用優惠
              </Label>
            </div>
          </RadioGroup>
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
          <Button variant="outline" className="h-10" disabled={applying} onClick={onApply}>
            {applying ? '驗證中...' : '使用優惠碼'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const RenewOrder = ({
  detail,
  id: _id,
  promotions = []
}: {
  detail: OrderItemInfoType;
  id: string;
  promotions?: PromotionOption[];
}) => {
  const router = useRouter();
  const order = detail;
  const { token } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [customMonths, setCustomMonths] = useState(6);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayTypeEnum | null>(null);
  /** 当前选中的优惠活动 id（null 表示不使用优惠） */
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  /** 优惠码输入框内容 */
  const [promotionCode, setPromotionCode] = useState('');
  /** 通过优惠码成功兑换、可供选择的优惠活动 */
  const [appliedCodePromotions, setAppliedCodePromotions] = useState<PromotionOption[]>([]);
  const [applyingCode, setApplyingCode] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">找不到訂單</h1>
            <p className="text-muted-foreground mb-6">該訂單不存在或已被刪除</p>
            <Link href="/my-orders">
              <Button>返回我的訂單</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const addService = order.orderItems.filter(item => item.itemType === OrderItemTypeEnum.ADDITION);

  const selectedOption = renewalOptions.find(opt => opt.id === selectedPeriod)!;
  const selectedMonths = selectedOption.id === 'custom' ? customMonths : selectedOption.months;
  const yearlyPrice = order.platformPackageDto?.price || 0;
  const months = selectedMonths;
  const originalPrice = yearlyPrice * months;

  /** 优惠价格 1个月-2个月 -> price 3个月-5个月 -> priceA 6个月-11个月 -> priceB 12个月及以上 -> priceC */
  // oxlint-disable react-hooks/rules-of-hooks
  const discountAmount = useMemo<number>(() => {
    // 原价
    let recursePrice = order.platformPackageDto?.price;
    if (months >= 12) {
      recursePrice = order.platformPackageDto?.priceC || recursePrice;
    }
    if (months >= 6 && months < 12) {
      recursePrice = order.platformPackageDto?.priceB || recursePrice;
    }
    if (months >= 3 && months < 6) {
      recursePrice = order.platformPackageDto?.priceA || recursePrice;
    }

    const diffPrice = Math.max(0, (order.platformPackageDto?.price || 0) - (recursePrice || 0)) * months;

    return Math.max(0, diffPrice);
    // oxlint-disable react-hooks/exhaustive-deps
  }, [months]);

  const addServicePrice = addService.reduce((acc, item) => acc + item.price! * item.count! * months, 0);

  // ---------------------------------------------------------------------------
  // 优惠活动 / 优惠码
  // ---------------------------------------------------------------------------
  const packageId = order.platformPackageDto?.id;

  /** 优惠前的应付金额（套餐费 + 增值服务 - 时长折扣） */
  const promotionBaseAmount = Math.max(0, addServicePrice + originalPrice - discountAmount);

  /** 活动优惠 + 优惠码兑换的优惠，仅保留对当前套餐有效的，并去重 */
  const availablePromotions = useMemo<PromotionOption[]>(() => {
    const list: PromotionOption[] = [];
    const seen = new Set<number>();
    for (const promotion of [...promotions, ...appliedCodePromotions]) {
      const pid = promotion?.promotionId;
      const matchesPackage = String(promotion?.packageId) === String(packageId);
      if (typeof pid === 'number' && matchesPackage && !seen.has(pid)) {
        seen.add(pid);
        list.push(promotion);
      }
    }
    return list;
  }, [promotions, appliedCodePromotions, packageId]);

  // 默认选中优惠力度最大的优惠活动；用户已手动选择则不覆盖
  useEffect(() => {
    if (availablePromotions.length === 0) return;
    if (selectedPromotionId !== null && availablePromotions.some(p => p.promotionId === selectedPromotionId)) return;
    const best = availablePromotions.reduce((a, b) =>
      getPromotionDiscount(b, promotionBaseAmount) > getPromotionDiscount(a, promotionBaseAmount) ? b : a
    );
    setSelectedPromotionId(best.promotionId);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePromotions]);

  const { promotionDiscount, selectedPromotion } = useMemo(() => {
    const promotion = availablePromotions.find(p => p.promotionId === selectedPromotionId) ?? null;
    return {
      selectedPromotion: promotion,
      promotionDiscount: promotion ? getPromotionDiscount(promotion, promotionBaseAmount) : 0
    };
  }, [availablePromotions, selectedPromotionId, promotionBaseAmount]);

  const finalPrice = Math.max(0, promotionBaseAmount - promotionDiscount);

  /** 输入优惠码兑换优惠 */
  const handleApplyCode = async () => {
    const code = promotionCode.trim();
    if (!code) {
      toast.error('請輸入優惠碼');
      return;
    }
    setApplyingCode(true);
    try {
      const res = await fetch(
        `/go-tech/platform/promotion/search?promotionCode=${encodeURIComponent(code)}&packageId=${packageId}`,
        { headers: { Authorization: `Bearer ${token}`, 'User-Type': 'platform_customer' } }
      );
      const response = await res.json();
      if (!res.ok || !response || response.code !== 200 || !response.data) {
        throw new Error(response?.message || '優惠碼無效或不適用於該套餐');
      }
      const valid = toArray<PromotionOption>(response.data).filter(p => String(p.packageId) === String(packageId));
      if (valid.length === 0) {
        throw new Error('優惠碼不適用於該套餐');
      }
      setAppliedCodePromotions(prev => {
        const map = new Map(prev.map(p => [p.promotionId, p]));
        valid.forEach(p => map.set(p.promotionId, p));
        return [...map.values()];
      });
      setSelectedPromotionId(valid[0].promotionId);
      setPromotionCode('');
      toast.success('優惠碼已應用');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setApplyingCode(false);
    }
  };

  // 計算新到期日
  const currentExpiry = dayjs(new Date(order.expireDate || ''));
  const newExpiry = currentExpiry.add(months * DAYSPERMONTH, 'day');

  const handleConfirmPayment = () => {
    setShowPaymentDialog(true);
  };

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null);
  };

  // const handlePaymentSelect = (method: PayTypeEnum) => {
  //   console.log("Selected payment method:", method);
  //   setShowPaymentDialog(false);
  //   // 這裡可以跳轉到支付頁面或顯示成功訊息
  //   router.push("/my-orders");
  // };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    toast.dismiss();
    const toastId = toast.loading('創建續費訂單中...');
    const orderInfo: any = {
      orderType: OrderTypeEnum.RENEWAL,
      payType: selectedPaymentMethod,
      originalOrder: detail.orderNo,
      orderItems: [
        {
          packageId: detail.platformPackageDto?.id,
          itemType: OrderItemTypeEnum.PACKAGE,
          itemName: detail?.platformPackageDto?.packageName,
          price: detail?.platformPackageDto?.price,
          count: months,
          days: months * DAYSPERMONTH
        }
      ]
    };
    if (addService.length) {
      addService.map(item => {
        orderInfo.orderItems.push({
          packageId: detail.platformPackageDto?.id,
          itemType: OrderItemTypeEnum.ADDITION,
          itemCode: item.itemCode,
          itemName: item.itemName!,
          price: item.price!,
          count: item.count
        });
        return null;
      });
    }

    // 优惠活动 / 优惠码
    if (selectedPromotion) {
      orderInfo.promotionId = selectedPromotion.promotionId;
    }

    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Type': 'platform_customer'
    });

    try {
      // 创建订单
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(orderInfo)
      })
        .then(res => res.json())
        .catch(err => {
          throw err;
        });
      if (orderResponse.code === 200) {
        toast.success('續費訂單創建成功', { id: toastId });
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          await fetch('/go-tech/platform/packageOrder/payEvidence', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              id: orderId,
              payEvidence: voucherFile.url
            })
          })
            .catch(err => {
              throw err;
            })
            .then(res => res.json());
        }

        setShowPaymentDialog(false);
        setSelectedPaymentMethod(null);
        router.push('/my-orders');
        toast.success('支付憑證已提交，我們將在確認後為您續費', { id: toastId });
      } else {
        toast.error(orderResponse.message, { id: toastId });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">續費套餐</h1>
              <p className="text-muted-foreground">訂單編號：{order.id}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Renewal Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 當前套餐信息 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{order.packageName}</h2>
                      <p className="text-sm text-muted-foreground">
                        最多可創建{order.platformPackageDto?.unitCount}個單位
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-200">使用中</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>當前到期日：{order.expireDate}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {order.platformPackageDto?.packageItemList?.map((feature: any) => {
                    if (feature.level >= 2) return null;
                    return (
                      <div key={feature.id} className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#FAEEEB]">
                        {feature.menuIcon && (
                          <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                            <use href={`#icon-${feature.menuIcon}`} xlinkHref={`#icon-${feature.menuIcon}`} />
                          </svg>
                        )}
                        <span className="text-xs">{feature.menuTitle}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 增值服务 */}
            {addService.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">增值服務</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addService.map(service => {
                      return (
                        <div
                          key={service.itemCode}
                          className="flex items-center justify-between py-3 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-gray-700">{service.itemName}</span>
                          <div className="flex items-center gap-8">
                            <span className="text-sm font-medium">${service.amount}</span>
                            <span className="text-sm text-muted-foreground">數量 {service.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 續費選項 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">選擇續費時長</h2>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-3">
                  {renewalOptions.map(option => {
                    const optionMonths = option.id === 'custom' ? customMonths : option.months;
                    const price = yearlyPrice * optionMonths;
                    const discount = price * option.discount;
                    const final = price - discount;

                    return (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPeriod === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedPeriod(option.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="cursor-pointer">
                            <span className="font-medium">{option.label}</span>
                            {option.id === 'custom' && (
                              <span className="ml-2 inline-flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-20 h-8 text-center"
                                  value={customMonths}
                                  onClick={() => setSelectedPeriod('custom')}
                                  onChange={e => {
                                    const value = Math.max(1, Number.parseInt(e.target.value || '1', 10));
                                    setCustomMonths(value);
                                    setSelectedPeriod('custom');
                                  }}
                                />
                                <span className="text-sm">个月</span>
                              </span>
                            )}
                            {option.discount > 0 && (
                              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600">
                                省 {option.discount * 100}%
                              </Badge>
                            )}
                          </Label>
                        </div>
                        <div className="text-right">
                          {option.discount > 0 && (
                            <span className="text-sm text-muted-foreground line-through mr-2">
                              ${price.toLocaleString()}
                            </span>
                          )}
                          <span className="font-bold text-primary">${final.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* 優惠活動 */}
            <RenewPromotionCard
              promotions={availablePromotions}
              selectedPromotionId={selectedPromotionId}
              onSelect={setSelectedPromotionId}
              baseAmount={promotionBaseAmount}
              code={promotionCode}
              onCodeChange={setPromotionCode}
              applying={applyingCode}
              onApply={handleApplyCode}
            />

            {/* 價格明細 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">價格明細</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>
                    {order.packageName} × {months}月
                  </span>
                  <span>${originalPrice.toLocaleString()}</span>
                </div>
                {addService.length > 0 &&
                  addService.map((addon: any) => (
                    <div key={addon.id} className="flex justify-between items-center pl-4">
                      <span className="text-sm">
                        {addon.itemName} × {addon.count}
                      </span>
                      <span className="text-sm">${addon.price * months}</span>
                    </div>
                  ))}

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>時長優惠</span>
                    <span>-${discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {promotionDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>活動優惠</span>
                    <span>-${promotionDiscount.toLocaleString()}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>應付金額</span>
                  <span className="text-primary">${finalPrice.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    預計續費後新到期日：
                    {newExpiry?.toISOString()?.split('T')?.[0]}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button className="gap-2" onClick={handleConfirmPayment}>
                <CreditCard className="w-4 h-4" />
                確認續費
              </Button>
            </div>

            {/* 購買新套餐 */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-gray-300">
              <div>
                <h3 className="font-medium">需要更多功能？</h3>
                <p className="text-sm text-muted-foreground">探索其他套餐方案，找到最適合您的選擇</p>
              </div>
              <Link href="/service-plan">
                <Button variant="outline" className="gap-2">
                  <Package className="w-4 h-4" />
                  購買新套餐
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 支付方式選擇 Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={open => {
          setShowPaymentDialog(open);
          if (!open) {
            setSelectedPaymentMethod(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {selectedPaymentMethod === PayTypeEnum.FPS ? 'FPS 轉數快支付' : '選擇支付方式'}
            </DialogTitle>
          </DialogHeader>

          {selectedPaymentMethod === PayTypeEnum.FPS ? (
            <Fps
              price={finalPrice}
              handleBackToPaymentMethods={handleBackToPaymentMethods}
              handleFpsPaymentConfirm={handleFpsPaymentConfirm}
            />
          ) : (
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                disabled
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.WechatPay)}
                className="h-14 text-lg justify-start gap-4 hover:bg-green-50 hover:border-green-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">微</span>
                </div>
                微信支付
              </Button>
              <Button
                variant="outline"
                disabled
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.Alipay)}
                className="h-14 text-lg justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">支</span>
                </div>
                支付寶支付
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.FPS)}
                className="h-14 text-lg justify-start gap-4 hover:bg-orange-50 hover:border-orange-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FPS</span>
                </div>
                FPS 轉數快
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default RenewOrder;
