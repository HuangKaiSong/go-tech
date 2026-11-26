import { BasePackageCard, ServiceAddonCard } from '@go-tech/package-ui';
import { toAddonCardPlan } from '@go-tech/package-ui/model';
import { toPackageCardPlan } from './package-model';
import type { MenuNode, PackageDraft } from './package-model';

export function PackagePreview({ menuTree, plan }: { menuTree?: MenuNode[]; plan: PackageDraft }) {
  const addons = plan.additionalItems.toSorted((left, right) => left.itemType - right.itemType);

  return (
    <div className="@container mx-auto max-w-6xl break-words">
      <div
        className={`grid items-start gap-6 ${addons.length ? '@min-[52rem]:grid-cols-[minmax(0,340px)_minmax(0,1fr)]' : ''}`}
      >
        <div className="mx-auto w-full max-w-85">
          <BasePackageCard plan={toPackageCardPlan(plan, menuTree)} product={plan.bizCode} />
        </div>
        {addons.length > 0 && (
          <div className="min-w-0">
            <h3 className="mb-4 text-xl font-bold text-foreground">可加購的附加模塊</h3>
            <div className="grid gap-4 @min-[28rem]:grid-cols-2 @min-[65rem]:grid-cols-3">
              {addons.map((addon, index) => (
                <ServiceAddonCard
                  key={addon.id ?? `${addon.itemName}-${index}`}
                  plan={toAddonCardPlan(addon, plan.bizCode)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
