import { buildPackageCatalog } from '@/app/lib/package-catalog';
import { captureServerError } from '@/lib/browser-monitor/server';
import { getBaseUrl } from '@/lib/http';
import { serverPlatformFetch } from '@/lib/server-fetch';
import PageClient from './page';
import { buildPricingData } from './pricing-plan-data';

const fetchData = async (url: string): Promise<unknown> => {
  try {
    const response = await serverPlatformFetch(url);
    return response.ok ? await response.json() : undefined;
  } catch (error) {
    await captureServerError(error);
    return undefined;
  }
};

export default async function Layout() {
  const baseUrl = getBaseUrl();
  const [packageResponse, pmsMenuResponse, hrMenuResponse] = await Promise.all([
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/enabledList`),
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/menuTree?bizCode=pms`),
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/menuTree?bizCode=hr`)
  ]);
  const catalog = buildPackageCatalog(packageResponse);
  const pmsMenus = (pmsMenuResponse as HttpBaseResponse<MenuType[]> | undefined)?.data || [];
  const hrMenus = (hrMenuResponse as HttpBaseResponse<MenuType[]> | undefined)?.data || [];

  return (
    <PageClient
      pricingCatalog={{
        pms: buildPricingData('pms', catalog.pms, pmsMenus),
        hr: buildPricingData('hr', catalog.hr, hrMenus)
      }}
    />
  );
}
