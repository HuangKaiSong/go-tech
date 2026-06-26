import { toast } from '@go-tech-frontend/ui';
import { useEffect, useMemo, useState } from 'react';
import { type PromotionOption, getPromotionDiscount, toArray } from '@/app/constants/promotion';

interface UsePromotionsParams {
  /** 优惠前的应付金额，用于计算折扣额与自动选最优 */
  baseAmount: number;
  /** 当前套餐 id，用于过滤活动优惠 / 查询优惠码 */
  packageId: number | string | undefined;
  /** 服务端预取的活动优惠 */
  promotions: PromotionOption[];
  /** 鉴权 token（优惠码查询用） */
  token?: string;
}

interface UsePromotionsResult {
  applyingCode: boolean;
  availablePromotions: PromotionOption[];
  handleApplyCode: () => Promise<void>;
  promotionCode: string;
  promotionDiscount: number;
  selectedPromotion: PromotionOption | null;
  selectedPromotionId: number | null;
  setPromotionCode: (code: string) => void;
  setSelectedPromotionId: (id: number | null) => void;
}

/**
 * 优惠活动 / 优惠码逻辑（购买与续费流程共用）。
 *
 * 维护选中的优惠、优惠码兑换的优惠，并基于 `baseAmount` 计算折扣额、默认选中力度最大的优惠。
 */
export const usePromotions = ({ baseAmount, packageId, promotions, token }: UsePromotionsParams): UsePromotionsResult => {
  /** 当前选中的优惠活动 id（null 表示不使用优惠） */
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  /** 优惠码输入框内容 */
  const [promotionCode, setPromotionCode] = useState('');
  /** 通过优惠码成功兑换、可供选择的优惠活动 */
  const [appliedCodePromotions, setAppliedCodePromotions] = useState<PromotionOption[]>([]);
  const [applyingCode, setApplyingCode] = useState(false);

  /** 活动优惠 + 优惠码兑换的优惠，仅保留对当前套餐有效的，并去重 */
  const availablePromotions = useMemo<PromotionOption[]>(() => {
    const list: PromotionOption[] = [];
    const seen = new Set<number>();
    for (const promotion of [...promotions, ...appliedCodePromotions]) {
      const id = promotion?.promotionId;
      const matchesPackage = String(promotion?.packageId) === String(packageId);
      if (typeof id === 'number' && matchesPackage && !seen.has(id)) {
        seen.add(id);
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
      getPromotionDiscount(b, baseAmount) > getPromotionDiscount(a, baseAmount) ? b : a
    );
    setSelectedPromotionId(best.promotionId);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePromotions]);

  const { promotionDiscount, selectedPromotion } = useMemo(() => {
    const promotion = availablePromotions.find(p => p.promotionId === selectedPromotionId) ?? null;
    return {
      selectedPromotion: promotion,
      promotionDiscount: promotion ? getPromotionDiscount(promotion, baseAmount) : 0
    };
  }, [availablePromotions, selectedPromotionId, baseAmount]);

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

  return {
    applyingCode,
    availablePromotions,
    handleApplyCode,
    promotionCode,
    promotionDiscount,
    selectedPromotion,
    selectedPromotionId,
    setPromotionCode,
    setSelectedPromotionId
  };
};
