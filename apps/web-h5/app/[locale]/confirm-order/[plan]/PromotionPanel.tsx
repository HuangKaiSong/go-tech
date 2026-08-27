import { Button, Input } from '@go-tech-frontend/ui';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import { type PromotionOption, getPromotionDiscount } from '@/app/constants/promotion';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';

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
export const PromotionPanel = ({
  applying,
  baseAmount,
  code,
  onApply,
  onCodeChange,
  onSelect,
  promotions,
  selectedPromotionId
}: PromotionPanelProps) => {
  const codePlaceholder = useBatchTranslation('輸入優惠碼');

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h3 className="text-lg font-bold text-gray-700">
          <DynamicText text="優惠活動" />
        </h3>
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
                    <p className="text-sm font-medium text-gray-700">
                      <DynamicText text={promotion.promotionName} />
                    </p>
                    {promotion.promotionDesc && (
                      <p className="text-xs text-muted-foreground">
                        <DynamicText text={promotion.promotionDesc} />
                      </p>
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
            <span className="text-sm text-gray-700">
              <DynamicText text="不使用優惠" />
            </span>
          </label>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <DynamicText text="該套餐暫無可用優惠活動" />
        </p>
      )}

      {/* 优惠码 */}
      <div className="mt-4 flex items-center gap-2">
        <Input
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          placeholder={codePlaceholder}
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
          {applying ? <DynamicText text="驗證中..." /> : <DynamicText text="使用優惠碼" />}
        </Button>
      </div>
    </div>
  );
};

export default PromotionPanel;
