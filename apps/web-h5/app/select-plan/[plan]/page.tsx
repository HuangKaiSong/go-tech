import { getBaseUrl } from "@/lib/http";
import PageClient from "./_page";

export default async function SelectPlanPage({
  params,
}: {
  params: { plan: string };
}) {
  const { plan } = await params;
  const baseUrl = getBaseUrl();
  const packagesData = await fetch(`${baseUrl}/go-tech/platform/platformPackage/detail/${plan}`).then(res => res.json()) as HttpBaseResponse<Packages>;
  const packages = packagesData?.data as Packages

  if (packages.packageItemList) {
    packages.packageItemList = packages.packageItemList.filter(item => {
      return item.level <= 1;
    })
  }

  return <PageClient plan={packages} />;
}
