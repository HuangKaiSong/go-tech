/** 优惠查询接口返回的单条优惠（已按套餐拍平，ruleType 1=滿減 2=按百分比） */
export interface PromotionOption {
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
export const toArray = <T>(data: T | T[] | null | undefined): T[] => {
  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
};

/** 根据优惠规则计算优惠金额：ruleType 1=滿減，2=按百分比 */
export const getPromotionDiscount = (promotion: PromotionOption, baseAmount: number) => {
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
