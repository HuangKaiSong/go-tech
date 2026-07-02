interface PriceSummaryProps {
  durationDiscount: number;
  originalPrice: number;
  promotionDiscount: number;
  totalPrice: number;
}

/** 費用匯總卡片：原價 / 時長優惠 / 活動優惠 / 總計 */
export const PriceSummary = ({ durationDiscount, originalPrice, promotionDiscount, totalPrice }: PriceSummaryProps) => {
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

export default PriceSummary;
