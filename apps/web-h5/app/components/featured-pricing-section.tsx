// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';

import { getBaseUrl } from '@/lib/http';
import PricingSection from './PricingSection';

async function getFeaturedPackages(): Promise<Packages[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/go-tech/platform/platformPackage/enabledList`);

    if (!response.ok) {
      console.error(`Package API request failed with status ${response.status}`);
      return [];
    }

    const packagesData = (await response.json()) as HttpBaseResponse<Packages[]>;

    if (!packagesData || typeof packagesData !== 'object' || !Array.isArray(packagesData.data)) {
      console.warn('Unexpected package API response format:', packagesData);
      return [];
    }

    return packagesData.data.slice(0, 3);
  } catch (error) {
    console.error('Error fetching featured packages:', error);
    return [];
  }
}

export default async function FeaturedPricingSection() {
  const packages = await getFeaturedPackages();

  return <PricingSection packages={packages} />;
}
