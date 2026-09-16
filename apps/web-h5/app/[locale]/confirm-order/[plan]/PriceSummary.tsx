import { formatPackagePrice } from '@go-tech/package-ui/model';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import type { getPurchaseTotals } from '@/app/lib/package-purchase';

interface PriceSummaryProps {
  plan: Packages;
  totals: ReturnType<typeof getPurchaseTotals>;
}

const money = (value: number) => formatPackagePrice(value) ?? '—';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold text-foreground">
      <span className="h-6 w-1 rounded-full bg-primary" />
      {children}
    </h2>
  );
}

/** 費用匯總卡片：原價 / 時長優惠 / 活動優惠 / 總計 */
export const PriceSummary = ({ plan, totals }: PriceSummaryProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" aria-label="費用明細">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
        <SectionTitle>
          <DynamicText text="費用明細" />
        </SectionTitle>
        <span className="text-xs text-muted-foreground">開通 {totals.months} 個月</span>
      </div>
      <div className="flex justify-between gap-4 border-b border-border px-6 py-4 text-sm">
        <div>
          <strong>
            <DynamicText text={plan.packageName} />
            <span className="ml-2 text-xs text-muted-foreground">套餐費用</span>
          </strong>
          <p className="mt-1 text-xs text-muted-foreground">
            ${money(plan.price)} / 月 × {totals.months} 個月
          </p>
        </div>
        <strong>${money(totals.baseOriginal)}</strong>
      </div>
      {totals.lines.length ? (
        totals.lines.map(line => (
          <div key={line.key} className="flex justify-between gap-4 border-b border-border px-6 py-4 text-sm">
            <div>
              <DynamicText text={line.service.itemName} />
              <p className="mt-1 text-xs text-muted-foreground">
                ${money(line.service.price)} × {line.quantity} × {totals.months} 個月
              </p>
            </div>
            <strong>${money(line.total)}</strong>
          </div>
        ))
      ) : (
        <p className="border-b border-border px-6 py-4 text-xs text-muted-foreground">
          <DynamicText text="未選購增值服務" />
        </p>
      )}
      <dl className="space-y-2 bg-muted/20 px-6 py-4 text-xs ">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            套餐小計 <span>(${money(plan.price)} / 月)</span>
          </dt>
          <dd>
            {totals.savings > 0 && (
              <span className="mr-1.5  text-muted-foreground line-through">${money(totals.baseOriginal)}</span>
            )}
            <strong className="text-primary">${money(totals.basePayable)}</strong>
            <span className="ml-1  text-primary">HKD</span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">增值服務小計</dt>
          <dd>${money(totals.addonsTotal)} HKD</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt className="text-muted-foreground">原價合計</dt>
          <dd className="line-through">${money(totals.originalTotal)} HKD</dd>
        </div>
        {totals.savings > 0 && (
          <div className="flex justify-between text-primary">
            <dt>套餐優惠（時長優惠）</dt>
            <dd>−${money(totals.savings)} HKD</dd>
          </div>
        )}
        {totals.promotionDiscount > 0 && (
          <div className="flex justify-between text-primary">
            <dt>活動優惠</dt>
            <dd>−${money(totals.promotionDiscount)} HKD</dd>
          </div>
        )}
      </dl>
      <div className="px-6 py-4 border-t-2 border-primary/30  flex items-center justify-between" aria-live="polite">
        <dt className="text-lg font-bold">應付總額</dt>
        <dd className="flex items-baseline gap-2">
          {(totals.savings > 0 || totals.promotionDiscount > 0) && (
            <div className="text-sm text-muted-foreground line-through">${money(totals.originalTotal)}</div>
          )}
          <div className="text-3xl font-bold text-primary">${money(totals.total)}</div>
          <div className="text-sm text-primary">HKD</div>
        </dd>
      </div>
    </div>
  );
};

export default PriceSummary;
