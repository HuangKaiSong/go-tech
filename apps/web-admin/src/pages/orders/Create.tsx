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
import { formatPackagePrice, getPackageFeatures } from '@go-tech/package-ui/model';
import type { Packages } from '@go-tech/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, FileText, Minus, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fps from '@/components/payment/Fps';
import { PayTypeEnum } from '@/constants/payment';
import { useAuth } from '@/hooks/use-auth';
import {
  DEFAULT_ADDON_QUANTITY,
  buildCreateOrderPayload,
  getAddonKey,
  getCreatedOrderId,
  getPurchaseTotals,
  normalizeQuantity
} from './create-order-model';
import type { AddonSelection, CreateOrderPayload, PurchaseTotals } from './create-order-model';

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

interface CustomerOption {
  custCode: string;
  custName: string;
}

/** 优惠查询接口返回的单条优惠（已按套餐拍平，ruleType 1=滿減 2=按百分比） */
interface PromotionOption {
  discountValue?: number;
  packageId: number | string;
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

const money = (value: number) => formatPackagePrice(value) ?? '0';

const PlanOptions = ({
  onSelect,
  plans,
  selectedPlanId
}: {
  onSelect: (planId: number) => void;
  plans: Packages[];
  selectedPlanId: number | null;
}) =>
  plans.map(plan => {
    const features = getPackageFeatures({
      features: plan.detail?.features,
      menu: plan.detail?.menu
    });
    return (
      <button
        type="button"
        key={plan.id}
        onClick={() => onSelect(plan.id)}
        className={`w-full p-4 rounded-lg border-2 cursor-pointer text-left transition-all ${
          selectedPlanId === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-lg">{plan.packageName}</h4>
            {plan.detail?.dataCount !== undefined && (
              <p className="text-sm text-muted-foreground">最多可創建{plan.detail.dataCount}個單位</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">${money(plan.price)}</div>
            <span className="text-xs text-muted-foreground">HKD/月</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {features.map((feature, index) => (
            <span
              key={`${feature}-${index}`}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#FAEEEB] text-muted-foreground"
            >
              <Check className="w-3 h-3 text-[#F9881E]" />
              {feature}
            </span>
          ))}
        </div>
      </button>
    );
  });

const AddonOptions = ({
  onQuantityChange,
  onToggle,
  plan,
  purchase
}: {
  onQuantityChange: (key: string, delta: number) => void;
  onToggle: (key: string) => void;
  plan: Packages;
  purchase: PurchaseTotals;
}) => {
  const addons = plan.additionalItems ?? [];

  return (
    <>
      <Separator />
      <div>
        <h4 className="font-medium text-foreground mb-3">選購增值服務（可選）</h4>
        <div className="space-y-3">
          {addons.length === 0 && (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              此套餐暫無附加服務
            </p>
          )}
          {addons.map((service, index) => {
            const key = getAddonKey(plan, service, index);
            const line = purchase.lines.find(item => item.key === key);
            const isSelected = Boolean(line);
            const quantity = line?.quantity ?? DEFAULT_ADDON_QUANTITY;

            return (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(key)}
                      aria-label={service.itemName}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{service.itemName}</p>
                      <p className="text-xs text-muted-foreground">${money(service.price)} HKD / 個 / 月</p>
                      {isSelected && (
                        <p className="text-xs text-primary">
                          小計 ${money(line?.total ?? 0)} HKD（{purchase.months} 個月）
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`減少${service.itemName}數量`}
                        onClick={() => onQuantityChange(key, -1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`增加${service.itemName}數量`}
                        onClick={() => onQuantityChange(key, 1)}
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
  );
};

const OrderPriceSummary = ({
  promotionDiscount,
  promotionName,
  purchase,
  total
}: {
  promotionDiscount: number;
  promotionName?: string;
  purchase: PurchaseTotals;
  total: number;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">套餐費用</span>
      <span>${money(purchase.baseOriginal)} HKD</span>
    </div>
    {purchase.addonsTotal > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">增值服務</span>
        <span>${money(purchase.addonsTotal)} HKD</span>
      </div>
    )}
    {purchase.savings > 0 && (
      <div className="flex justify-between text-sm text-green-600">
        <span className="text-green-600">套餐優惠（時長優惠）</span>
        <span>-${money(purchase.savings)} HKD</span>
      </div>
    )}
    {promotionDiscount > 0 && (
      <div className="flex justify-between text-sm text-green-600">
        <span className="text-green-600">活動優惠{promotionName ? `（${promotionName}）` : ''}</span>
        <span>-${money(promotionDiscount)} HKD</span>
      </div>
    )}
    <Separator />
    <div className="flex justify-between items-center text-lg font-bold">
      <span>總計</span>
      <span className="text-primary">${money(total)} HKD</span>
    </div>
  </div>
);

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toastId = useRef<string | number>(null);

  const [client, setClient] = useState('');
  const [month, setMonth] = useState<number>(1);
  const [activateDate, setActivateDate] = useState<string>();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<AddonSelection>({});
  /** Undefined=自动选择最佳优惠，null=明确不使用优惠 */
  const [promotionChoice, setPromotionChoice] = useState<number | null>();
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedCodePromotions, setAppliedCodePromotions] = useState<PromotionOption[]>([]);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayTypeEnum | null>(null);

  /** 选择客户 */
  const { data: customerData } = useQuery<CustomerOption[]>({
    queryKey: ['platformCustomer/page'],
    queryFn: async () => {
      const url = new URL(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/page`,
        location.origin
      );
      url.searchParams.append('current', '1');
      url.searchParams.append('size', '999999');

      const res = await fetch(url.toString());
      const response = (await res.json()) as ApiResponse<{ records?: CustomerOption[] }>;

      if (!res.ok || response.code !== 200) {
        throw new Error(response.message || '獲取客戶失敗');
      }

      return response.data?.records ?? [];
    },
    initialData: () => []
  });

  const filteredCustomers = customerData.filter(item => {
    if (!clientSearch) return true;
    return item.custName.toLowerCase().includes(clientSearch.toLowerCase());
  });

  /** 获取可用套餐 */
  const { data: plans } = useQuery<Packages[]>({
    queryKey: ['enabledList'],
    queryFn: async () => {
      const url = new URL(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enabledList`,
        location.origin
      );
      const res = await fetch(url);
      const response = (await res.json()) as ApiResponse<Packages[]>;
      if (!res.ok || response.code !== 200) {
        throw new Error(response.message || '獲取套餐失敗');
      }

      return response.data ?? [];
    },
    initialData: () => []
  });

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const purchase = getPurchaseTotals(selectedPlan, month, selectedAddons);

  // ---------------------------------------------------------------------------
  // 获取可以使用的优惠活动(创建时选择套餐触发)
  // ---------------------------------------------------------------------------
  const { data: activityPromotions } = useQuery<PromotionOption[]>({
    queryKey: ['promotion-search', selectedPlan?.packageCode],
    enabled: Boolean(selectedPlan?.packageCode),
    retry: false,
    queryFn: async () => {
      try {
        const packageCode = selectedPlan?.packageCode;
        if (!packageCode) return [];
        const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/search`, location.origin);
        url.searchParams.append('packageCode', packageCode);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch promotion detail');
        const response = (await res.json()) as ApiResponse<PromotionOption | PromotionOption[]>;
        if (response.code !== 200) throw new Error(response.message || 'Failed to fetch promotion detail');
        return toArray<PromotionOption>(response?.data);
      } catch {
        return [];
      }
    },
    initialData: () => [],
    staleTime: 0,
    gcTime: 0
  });

  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
    setSelectedAddons({});
    setPromotionCode('');
    setAppliedCodePromotions([]);
    setPromotionChoice(undefined);
  };

  const toggleAddon = (key: string) => {
    setSelectedAddons(previous => {
      const next = { ...previous };
      if (next[key] > 0) {
        delete next[key];
      } else {
        next[key] = DEFAULT_ADDON_QUANTITY;
      }
      return next;
    });
  };

  const updateAddonQuantity = (key: string, delta: number) => {
    setSelectedAddons(previous => {
      const quantity = (previous[key] ?? 0) + delta;
      if (quantity < 1) {
        const next = { ...previous };
        delete next[key];
        return next;
      }
      return { ...previous, [key]: normalizeQuantity(quantity) };
    });
  };

  // ---------------------------------------------------------------------------
  // 优惠活动 / 优惠码
  // ---------------------------------------------------------------------------

  /** 优惠前的应付金额（套餐费 - 时长折扣 + 增值服务） */
  const promotionBaseAmount = purchase.total;

  /** 活动优惠 + 优惠码兑换的优惠，仅保留对当前套餐有效的，并去重 */
  const availablePromotions = useMemo<PromotionOption[]>(() => {
    const list: PromotionOption[] = [];
    const seen = new Set<number>();
    for (const promotion of [...activityPromotions, ...appliedCodePromotions]) {
      const id = promotion?.promotionId;
      const matchesPackage =
        String(promotion?.packageId) === String(selectedPlan?.packageCode) ||
        String(promotion?.packageId) === String(selectedPlan?.id);
      if (typeof id === 'number' && matchesPackage && !seen.has(id)) {
        seen.add(id);
        list.push(promotion);
      }
    }
    return list;
  }, [activityPromotions, appliedCodePromotions, selectedPlan]);

  const automaticPromotion = useMemo(() => {
    if (availablePromotions.length === 0) return null;
    return availablePromotions.reduce((best, promotion) =>
      getPromotionDiscount(promotion, promotionBaseAmount) > getPromotionDiscount(best, promotionBaseAmount)
        ? promotion
        : best
    );
  }, [availablePromotions, promotionBaseAmount]);
  const selectedPromotion =
    promotionChoice === undefined
      ? automaticPromotion
      : (availablePromotions.find(promotion => promotion.promotionId === promotionChoice) ?? null);
  const selectedPromotionId = selectedPromotion?.promotionId ?? null;
  const promotionDiscount = selectedPromotion ? getPromotionDiscount(selectedPromotion, promotionBaseAmount) : 0;
  const totalPrice = Math.max(0, purchase.total - promotionDiscount);

  /** 输入优惠码兑换优惠 */
  const applyCodeMu = useMutation({
    mutationFn: async (code: string) => {
      if (!selectedPlan?.packageCode) throw new Error('請先選擇套餐');
      const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/search`, location.origin);
      url.searchParams.append('promotionCode', code);
      url.searchParams.append('packageCode', selectedPlan.packageCode);
      const res = await fetch(url.toString());
      const response = (await res.json()) as ApiResponse<PromotionOption | PromotionOption[]>;
      if (!res.ok || response.code !== 200 || !response.data) {
        throw new Error(response?.message || '優惠碼無效或不適用於該套餐');
      }
      const valid = toArray<PromotionOption>(response.data).filter(
        promotion =>
          String(promotion.packageId) === String(selectedPlan.packageCode) ||
          String(promotion.packageId) === String(selectedPlan.id)
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
      setPromotionChoice(promotions[0].promotionId);
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

  const createOrderMu = useMutation({
    mutationFn: async ({ orderInfo, voucherUrl }: { orderInfo: CreateOrderPayload; voucherUrl: string }) => {
      if (toastId.current !== null) toast.dismiss(toastId.current);
      toastId.current = toast.loading('創建訂單中...');

      const orderResponse = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderInfo)
      });
      const orderResult = (await orderResponse.json().catch(() => null)) as ApiResponse<unknown> | null;
      if (!orderResponse.ok || orderResult?.code !== 200) {
        throw new Error(orderResult?.message || '創建訂單失敗，請稍後重試');
      }
      const orderId = getCreatedOrderId(orderResult.data);

      const evidenceResponse = await fetch(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/payEvidence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, payEvidence: voucherUrl })
        }
      );
      const evidenceResult = (await evidenceResponse.json().catch(() => null)) as ApiResponse<unknown> | null;
      if (!evidenceResponse.ok || evidenceResult?.code !== 200) {
        throw new Error(evidenceResult?.message || '支付憑證提交失敗，請稍後重試');
      }
      return orderId;
    },
    onSuccess: () => {
      toast.success('訂單創建成功，支付憑證已提交', { id: toastId.current ?? undefined });
      setShowPaymentDialog(false);
      setSelectedPaymentMethod(null);
      navigate('/orders', { replace: true });
    },
    onError: error => {
      toast.error(error.message, { id: toastId.current ?? undefined });
    }
  });

  const handleFpsPaymentConfirm = (voucherFile: UploadedFile) => {
    if (!selectedPlan || createOrderMu.isPending) return;
    if (!voucherFile.url) {
      toast.error('支付憑證尚未上傳完成');
      return;
    }
    const userId: unknown = user?.userId;
    const createUser = typeof userId === 'number' || typeof userId === 'string' ? userId : undefined;
    const orderInfo = buildCreateOrderPayload({
      activateDate,
      createUser,
      custCode: client,
      months: month,
      payType: PayTypeEnum.FPS,
      plan: selectedPlan,
      promotionId: selectedPromotion?.promotionId,
      selection: selectedAddons
    });
    createOrderMu.mutate({ orderInfo, voucherUrl: voucherFile.url });
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
                {filteredCustomers.map(item => (
                  <SelectItem key={item.custCode} value={item.custCode}>
                    {item.custName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm">生成时间：</label>
            <DatePicker format="YYYY-MM-DD" onChange={value => setActivateDate(value?.format('YYYY-MM-DD'))} />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm">時長：</label>
            <Input
              value={month}
              type="number"
              min={1}
              step={1}
              onChange={event => {
                const value = Number(event.target.value);
                if (Number.isSafeInteger(value) && value >= 1) setMonth(value);
              }}
              className="h-9 w-40"
            />
            <div className="text-sm">月</div>
          </div>
          <PlanOptions plans={plans} selectedPlanId={selectedPlanId} onSelect={handlePlanSelect} />

          {/* 增值服務選擇 */}
          {selectedPlan && (
            <AddonOptions
              plan={selectedPlan}
              purchase={purchase}
              onToggle={toggleAddon}
              onQuantityChange={updateAddonQuantity}
            />
          )}

          {/* 優惠活動 */}
          {selectedPlan && (
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
                              onChange={() => setPromotionChoice(promotion.promotionId)}
                              className="w-4 h-4 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{promotion.promotionName}</p>
                              {promotion.promotionDesc && (
                                <p className="text-xs text-muted-foreground">{promotion.promotionDesc}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-green-600 shrink-0">-${money(amount)} HKD</span>
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
                        onChange={() => setPromotionChoice(null)}
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
          <OrderPriceSummary
            purchase={purchase}
            promotionDiscount={promotionDiscount}
            promotionName={selectedPromotion?.promotionName}
            total={totalPrice}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/orders', { replace: true })}>
              取消
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedPlan || !client || createOrderMu.isPending}
              onClick={handleConfirmUpgrade}
            >
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
              price={totalPrice}
              handleBackToPaymentMethods={handleBackToPaymentMethods}
              handleFpsPaymentConfirm={handleFpsPaymentConfirm}
            />
          ) : (
            <div className="grid gap-4 py-4">
              {/* <Button
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
              </Button> */}
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
