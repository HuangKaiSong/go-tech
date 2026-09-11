// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';

import { type PackageCatalog, buildPackageCatalog } from '@/app/lib/package-catalog';
import { getBaseUrl } from '@/lib/http';
import PricingSection from './PricingSection';

const emptyCatalog = (): PackageCatalog => ({ hr: [], pms: [] });

async function getPackageCatalog(): Promise<PackageCatalog> {
  try {
    const response = await fetch(`${getBaseUrl()}/go-tech/platform/platformPackage/enabledList`);

    if (!response.ok) {
      console.error(`Package API request failed with status ${response.status}`);
      return emptyCatalog();
    }

    const packagesData = (await response.json()) as unknown;
    const catalog = buildPackageCatalog(packagesData);

    if (catalog.pms.length === 0 && catalog.hr.length === 0) {
      console.warn('Package API returned no supported PMS/HR packages');
    }

    return catalog;
  } catch (error) {
    console.error('Error fetching featured packages:', error);
    return emptyCatalog();
  }
}

export default async function FeaturedPricingSection() {
  const catalog = await getPackageCatalog();

  return <PricingSection catalog={catalog} />;
}
