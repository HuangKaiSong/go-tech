import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  type UploadedFile,
  toast
} from '@go-tech-frontend/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, FileText, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fps from '@/components/payment/Fps';
import { OrderItemTypeEnum, OrderTypeEnum } from '@/constants/order';
import { PayTypeEnum } from '@/constants/payment';
import { useAuth } from '@/hooks/use-auth';

/** 优惠查询接口返回的单条优惠（已按套餐拍平，ruleType 1=滿減 2=按百分比） */
interface PromotionOption {
  discountValue?: number;
  packageId: number;
  packageName?: string;
  promotionDesc?: string;
  promotionId: number;
  promotionName: string;
  promotionNo: string;
  ruleType: 1 | 2;
  thresholdAmount?: number;
}

/** 后端可能返回单条或列表，统一规整为数组 */
const toArray = <T,>(data: T | T[] | null | undefined): T[] => {
  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
};

/** 根据优惠规则计算优惠金额：ruleType 1=滿減，2=按百分比 */
const getPromotionDiscount = (promotion: PromotionOption, baseAmount: number) => {
  const value = Number(promotion.discountValue) || 0;
  if (promotion.ruleType === 1) {
    const threshold = Number(promotion.thresholdAmount) || 0;
    return baseAmount >= threshold ? Math.min(baseAmount, value) : 0;
  }
  if (promotion.ruleType === 2) {
    return Math.min(baseAmount, Math.round((baseAmount * value) / 100));
  }
  return 0;
};

const valueAddedServices = [
  { id: 'rentSysPrice', name: 'Sales Module（租務）', price: 20 },
  { id: 'venueSysPrice', name: '跟進 Module（維務）', price: 20 },
  { id: 'accountingSysPrice', name: 'Xero Module（會計）', price: 50 },
  { id: 'custServiceSysPrice', name: '客服 Module（維務）', price: 20 },
  { id: 'addUnitPrice', name: '增加單位數量', price: 80 }
];

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toastId = useRef<string | number>(null);

  const [client, setClient] = useState('');
  const [month, setMonth] = useState<number>(1);
  const [activateDate, setActivateDate] = useState<any | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [upgradeSelectedServices, setUpgradeSelectedServices] = useState<Record<string, number>>({});
  /** 当前选中的优惠活动 id（null 表示不使用优惠） */
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  /** 优惠码输入框内容 */
  const [promotionCode, setPromotionCode] = useState('');
  /** 通过优惠码成功兑换、可供选择的优惠活动 */
  const [appliedCodePromotions, setAppliedCodePromotions] = useState<PromotionOption[]>([]);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayTypeEnum | null>(null);

  const optionProp = { label: 'custName', value: 'custCode' } as const;
  /** 选择客户 */
  const { data: customerData } = useQuery({
    queryKey: ['platformCustomer/page'],
    queryFn: async () => {
      const url = new URL(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/page`,
        location.origin
      );
      url.searchParams.append('current', '1');
      url.searchParams.append('size', '999999');

      const res = await fetch(url.toString());
      const response = await res.json();

      if (!response || response.code !== 200) {
        throw new Error('Failed to fetch customers');
      }

      return response.data?.records ?? [];
    },
    initialData: () => []
  });

  const filteredCustomers = (customerData ?? []).filter((item: any) => {
    if (!clientSearch) return true;
    const label = String(item?.[optionProp.label] ?? '');
    return label.toLowerCase().includes(clientSearch.toLowerCase());
  });

  /** 获取可用套餐 */
  const { data: plans } = useQuery({
    queryKey: ['enabledList'],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enabledList`,
          location.origin
        );
        const res = await fetch(url);
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return [];
      }
    },
    initialData: () => {
      return [];
    }
  });

  const getServiceUnitPrice = (serviceId: string) => {
    const currentPlan = plans.find(plan => plan.id === selectedUpgradePlan) as any;

    if (!currentPlan) return 0;

    if (serviceId === 'rentSysPrice') return currentPlan.rentSysPrice;
    if (serviceId === 'venueSysPrice') return currentPlan.venueSysPrice;
    if (serviceId === 'accountingSysPrice') return currentPlan.accountingSysPrice;
    if (serviceId === 'custServiceSysPrice') return currentPlan.custServiceSysPrice;
    if (serviceId === 'addUnitPrice') return currentPlan.addUnitPrice;

    return 0;
  };

  // ---------------------------------------------------------------------------
  // 获取可以使用的优惠活动(创建时选择套餐触发)
  // ---------------------------------------------------------------------------
  const { data: activityPromotions } = useQuery<PromotionOption[]>({
    queryKey: ['promotion-search', selectedUpgradePlan],
    enabled: selectedUpgradePlan !== null,
    retry: false,
    queryFn: async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/search`, location.origin);
        if (selectedUpgradePlan) {
          url.searchParams.append('packageId', String(selectedUpgradePlan));
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch promotion detail');
        const response = await res.json();
        return toArray<PromotionOption>(response?.data);
      } catch {
        return [];
      }
    },
    initialData: () => [],
    staleTime: 0,
    gcTime: 0
  });

  // 切换套餐时重置优惠相关状态（优惠码、已兑换优惠、选中项均与套餐绑定）
  useEffect(() => {
    setPromotionCode('');
    setAppliedCodePromotions([]);
    setSelectedPromotionId(null);
  }, [selectedUpgradePlan]);

  // 创建订单
  const createOrderMu = useMutation({
    mutationFn: async (_data: any) => {
      toast.dismiss(toastId.current!);
      toastId.current = toast.loading('处理中...');
      const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/add`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result || result.code !== 200) {
        throw new Error(result?.message || '請求失敗，請稍後重試');
      }
      return result;
    },
    onSuccess: _data => {
      toast.success('订单创建成功', { id: toastId.current! });
      return _data;
    },
    onError(error) {
      toast.error(error.message, { id: toastId.current! });
    }
  });
  const payEvidenceMu = useMutation({
    mutationFn: async (_data: any) => {
      const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/payEvidence`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      });
      const response = await res.json();
      if (!response || !response.code || response.code !== 200) {
        throw new Error('Failed to fetch data');
      }

      return response;
    },
    onSuccess: _data => {
      return _data;
    }
  });

  const toggleUpgradeService = (serviceId: string) => {
    setUpgradeSelectedServices(prev => {
      if (prev[serviceId]) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateUpgradeQuantity = (serviceId: string, delta: number) => {
    setUpgradeSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  /** 优惠价格 1个月-2个月 -> price 3个月-5个月 -> priceA 6个月-11个月 -> priceB 12个月及以上 -> priceC */
  const discountAmount = useMemo<number>(() => {
    const plan = plans.find(p => p.id === selectedUpgradePlan);
    if (!plan) {
      return 0;
    }
    // 原价
    let recursePrice = plan?.price;
    if (month >= 12) {
      recursePrice = plan?.priceC || recursePrice;
    }
    if (month >= 6 && month < 12) {
      recursePrice = plan?.priceB || recursePrice;
    }
    if (month >= 3 && month < 6) {
      recursePrice = plan?.priceA || recursePrice;
    }

    const diffPrice = Math.max(0, (plan?.price || 0) - (recursePrice || 0)) * month;

    return Math.max(0, diffPrice);
  }, [month, plans, selectedUpgradePlan]);

  const getUpgradePrice = () => {
    const plan = plans.find(p => p.id === selectedUpgradePlan);
    if (!plan) {
      return 0;
    }
    return plan.price * month;
  };

  const calculateUpgradeAddonsTotal = () => {
    const plan = plans.find(p => p.id === selectedUpgradePlan);
    if (!plan) return 0;
    return (
      Object.entries(upgradeSelectedServices).reduce((sum, [id, qty]) => {
        const service = valueAddedServices.find(s => s.id === id);
        return sum + (service ? plan[service.id] * qty : 0);
      }, 0) * month
    );
  };

  // ---------------------------------------------------------------------------
  // 优惠活动 / 优惠码
  // ---------------------------------------------------------------------------

  /** 优惠前的应付金额（套餐费 - 时长折扣 + 增值服务） */
  const promotionBaseAmount = useMemo(
    () => Math.max(0, getUpgradePrice() - discountAmount + calculateUpgradeAddonsTotal()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plans, selectedUpgradePlan, month, upgradeSelectedServices, discountAmount]
  );

  /** 活动优惠 + 优惠码兑换的优惠，仅保留对当前套餐有效的，并去重 */
  const availablePromotions = useMemo<PromotionOption[]>(() => {
    const list: PromotionOption[] = [];
    const seen = new Set<number>();
    for (const promotion of [...activityPromotions, ...appliedCodePromotions]) {
      const id = promotion?.promotionId;
      const matchesPackage = String(promotion?.packageId) === String(selectedUpgradePlan);
      if (typeof id === 'number' && matchesPackage && !seen.has(id)) {
        seen.add(id);
        list.push(promotion);
      }
    }
    return list;
  }, [activityPromotions, appliedCodePromotions, selectedUpgradePlan]);

  // 默认选中优惠力度最大的优惠活动；用户已手动选择则不覆盖
  useEffect(() => {
    if (availablePromotions.length === 0) return;
    if (selectedPromotionId !== null && availablePromotions.some(p => p.promotionId === selectedPromotionId)) return;
    const best = availablePromotions.reduce((a, b) =>
      getPromotionDiscount(b, promotionBaseAmount) > getPromotionDiscount(a, promotionBaseAmount) ? b : a
    );
    setSelectedPromotionId(best.promotionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePromotions]);

  const selectedPromotion = availablePromotions.find(p => p.promotionId === selectedPromotionId) ?? null;
  const promotionDiscount = selectedPromotion ? getPromotionDiscount(selectedPromotion, promotionBaseAmount) : 0;

  /** 输入优惠码兑换优惠 */
  const applyCodeMu = useMutation({
    mutationFn: async (code: string) => {
      const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/search`, location.origin);
      url.searchParams.append('promotionCode', code);
      if (selectedUpgradePlan) {
        url.searchParams.append('packageId', String(selectedUpgradePlan));
      }
      const res = await fetch(url.toString());
      const response = await res.json();
      if (!res.ok || !response || response.code !== 200 || !response.data) {
        throw new Error(response?.message || '優惠碼無效或不適用於該套餐');
      }
      // 仅保留对当前套餐有效的结果
      const valid = toArray<PromotionOption>(response.data).filter(
        p => String(p.packageId) === String(selectedUpgradePlan)
      );
      if (valid.length === 0) {
        throw new Error('優惠碼不適用於該套餐');
      }
      return valid;
    },
    onSuccess: promotions => {
      setAppliedCodePromotions(prev => {
        const map = new Map(prev.map(p => [p.promotionId, p]));
        promotions.forEach(p => map.set(p.promotionId, p));
        return [...map.values()];
      });
      // 兑换成功后选中该优惠
      setSelectedPromotionId(promotions[0].promotionId);
      setPromotionCode('');
      toast.success('優惠碼已應用');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleApplyCode = () => {
    const code = promotionCode.trim();
    if (!code) {
      toast.error('請輸入優惠碼');
      return;
    }
    applyCodeMu.mutate(code);
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    // 设置参数创建订单
    const currentPlan = plans.find(plan => plan.id === selectedUpgradePlan) as any;

    const orderInfo: any = {
      orderType: OrderTypeEnum.PURCHASE,
      payType: selectedPaymentMethod,
      orderItems: [
        {
          packageId: currentPlan.id,
          itemType: OrderItemTypeEnum.PACKAGE,
          itemName: currentPlan?.packageName,
          price: currentPlan?.price,
          count: month,
          days: month * 30
        }
      ]
    };

    if (activateDate) {
      orderInfo.activateDate = activateDate.format('YYYY-MM-DD');
    }

    if (upgradeSelectedServices) {
      Object.entries(upgradeSelectedServices).map(([serviceId, quantity]) => {
        const service = valueAddedServices.find(s => s.id === serviceId);
        if (!service) return null;
        orderInfo.orderItems.push({
          itemType: OrderItemTypeEnum.ADDITION,
          count: quantity,
          price: getServiceUnitPrice(serviceId),
          packageId: currentPlan?.id,
          itemName: service.name,
          itemCode: service.id.replace('Price', '')
        });
        return null;
      });
    }

    // 优惠活动 / 优惠码
    if (selectedPromotion) {
      orderInfo.promotionId = selectedPromotion.promotionId;
    }

    // 创建人
    orderInfo.createUser = user.userId;
    // 客户编码
    orderInfo.custCode = client;

    try {
      // 创建订单
      const orderResponse = await createOrderMu.mutateAsync(orderInfo);

      if (orderResponse.code === 200) {
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          const payEvidenceData = {
            id: orderId,
            payEvidence: voucherFile.url
          };
          await payEvidenceMu.mutateAsync(payEvidenceData);
        }

        setShowPaymentDialog(false);
        setSelectedPaymentMethod(null);

        navigate('/orders', { replace: true });
      } else {
        toast.error(orderResponse.message, { id: toastId.current! });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleConfirmUpgrade = () => {
    setShowPaymentDialog(true);
    setSelectedPaymentMethod(null);
  };

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null);
    setShowPaymentDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            訂單列表/<span className="text-muted-foreground">創建訂單</span>
          </h1>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </div>
      <div className="bg-card rounded-lg border border-border h-[calc(100vh-64px-48px-64px)] overflow-auto">
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">選擇您想创建的套餐方案，享受更多功能與服務</p>
          {/* 选择客户 */}
          <div className="space-y-3">
            <Label htmlFor="plan">選擇客户</Label>
            <Select value={client} onValueChange={value => setClient(value)}>
              <SelectTrigger>
                <SelectValue placeholder="请選擇客户" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="搜索客户"
                    className="h-8"
                    onKeyDown={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                  />
                </div>
                {filteredCustomers.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">無匹配客戶</div>
                )}
                {filteredCustomers.map((item: any) => (
                  <SelectItem key={String(item?.[optionProp.value])} value={String(item?.[optionProp.value])}>
                    {String(item?.[optionProp.label] ?? '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm">生成时间：</label>
            <DatePicker
              value={activateDate}
              format="YYYY-MM-DD"
              onChange={value => {
                console.log(value);

                setActivateDate(value);
              }}
            />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm">時長：</label>
            <Input
              value={month}
              type="number"
              min={1}
              onChange={e => setMonth(Number(e.target.value))}
              className="h-9 w-40"
            />
            <div className="text-sm">月</div>
          </div>
          {plans.map(plan => {
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedUpgradePlan(plan.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedUpgradePlan === plan.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{plan.packageName}</h4>
                    <p className="text-sm text-muted-foreground">最多可創建{plan.unitCount}個單位</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">${plan.price.toLocaleString()}</div>
                    <span className="text-xs text-muted-foreground">HKD/月</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {plan.packageItemList?.slice(0, 6)?.map((feature: any, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#FAEEEB] text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-[#F9881E]" />
                      {feature.menuTitle}
                    </span>
                  ))}
                  {plan.packageItemList?.length > 6 && (
                    <span className="text-xs text-muted-foreground">+{plan.packageItemList?.length - 6} 更多功能</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 增值服務選擇 */}
          {selectedUpgradePlan && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-foreground mb-3">選購增值服務（可選）</h4>
                <div className="space-y-3">
                  {valueAddedServices.map(service => {
                    const isSelected = upgradeSelectedServices[service.id] !== undefined;
                    const quantity = upgradeSelectedServices[service.id] || 0;
                    const currentPlan = plans.find(plan => plan.id === selectedUpgradePlan);

                    return (
                      <div
                        key={service.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUpgradeService(service.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{service.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ${currentPlan[service.id] * month} HKD / 個
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateUpgradeQuantity(service.id, -1)}
                                className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                              <button
                                onClick={() => updateUpgradeQuantity(service.id, 1)}
                                className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 優惠活動 */}
          {selectedUpgradePlan && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-foreground mb-3">優惠活動</h4>
                {availablePromotions.length > 0 ? (
                  <div className="space-y-3">
                    {availablePromotions.map(promotion => {
                      const isSelected = selectedPromotionId === promotion.promotionId;
                      const amount = getPromotionDiscount(promotion, promotionBaseAmount);
                      return (
                        <label
                          key={promotion.promotionId}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="promotion"
                              checked={isSelected}
                              onChange={() => setSelectedPromotionId(promotion.promotionId)}
                              className="w-4 h-4 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{promotion.promotionName}</p>
                              {promotion.promotionDesc && (
                                <p className="text-xs text-muted-foreground">{promotion.promotionDesc}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-green-600 shrink-0">
                            -${amount.toLocaleString()} HKD
                          </span>
                        </label>
                      );
                    })}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPromotionId === null
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="promotion"
                        checked={selectedPromotionId === null}
                        onChange={() => setSelectedPromotionId(null)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">不使用優惠</span>
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">該套餐暫無可用優惠活動</p>
                )}

                {/* 优惠码 */}
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={promotionCode}
                    onChange={e => setPromotionCode(e.target.value)}
                    placeholder="輸入優惠碼"
                    className="h-9 flex-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCode();
                      }
                    }}
                  />
                  <Button variant="outline" className="h-9" disabled={applyCodeMu.isPending} onClick={handleApplyCode}>
                    {applyCodeMu.isPending ? '驗證中...' : '使用優惠碼'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* 費用匯總 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">套餐費用</span>
              <span>${getUpgradePrice().toLocaleString()} HKD</span>
            </div>
            {calculateUpgradeAddonsTotal() > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">增值服務</span>
                <span>${calculateUpgradeAddonsTotal().toLocaleString()} HKD</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="text-green-600">優惠折扣</span>
                <span>-${discountAmount.toLocaleString()} HKD</span>
              </div>
            )}
            {promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="text-green-600">
                  活動優惠{selectedPromotion?.promotionName ? `（${selectedPromotion.promotionName}）` : ''}
                </span>
                <span>-${promotionDiscount.toLocaleString()} HKD</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>總計</span>
              <span className="text-primary">
                $
                {Math.max(
                  0,
                  getUpgradePrice() - discountAmount + calculateUpgradeAddonsTotal() - promotionDiscount
                ).toLocaleString()}{' '}
                HKD
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/orders', { replace: true })}>
              取消
            </Button>
            <Button className="flex-1" disabled={!selectedUpgradePlan || !client} onClick={handleConfirmUpgrade}>
              確認
            </Button>
          </div>
        </div>
      </div>

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
              price={Math.max(
                0,
                getUpgradePrice() - discountAmount + calculateUpgradeAddonsTotal() - promotionDiscount
              )}
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
    </div>
  );
};

export default CreateOrder;
