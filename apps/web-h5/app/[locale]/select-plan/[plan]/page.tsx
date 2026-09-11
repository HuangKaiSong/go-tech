import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { buildPackageCatalog } from '@/app/lib/package-catalog';
import { getBaseUrl } from '@/lib/http';
import PageClient from './_page';

export default async function SelectPlanPage({ params }: { params: Promise<{ plan: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value;
  if (!token) {
    return redirect('/account/login');
  }
  const { plan } = await params;
  const baseUrl = getBaseUrl();
  const packagesData = (await fetch(`${baseUrl}/go-tech/platform/platformPackage/detail/${plan}`).then(res =>
    res.json()
  )) as HttpBaseResponse<Packages>;
  const catalog = buildPackageCatalog([packagesData?.data]);
  const packages = [...catalog.hr, ...catalog.pms][0];
  if (!packages) notFound();

  if (packages.detail?.menu) {
    packages.detail.menu = packages.detail.menu.filter(item => {
      return item.level <= 1;
    });
  }

  return <PageClient key={plan} plan={packages} planId={plan} />;
}
