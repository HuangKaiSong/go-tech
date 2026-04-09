
import { getBaseUrl } from "@/lib/http";
import PageClient from "./_page";

export default async function ConfirmOrderPage({
  params,
}: {
  params: { plan: string } | Promise<{ plan: string }>;
}) {

  const { plan } = await params;
  const baseUrl = getBaseUrl();
  
  const packagesResponse = await fetch(`${baseUrl}/go-tech/platform/platformPackage/detail/${plan}`).then(res => res.json()) as HttpBaseResponse<Packages>;  
  const packagesData = (packagesResponse.data as Packages);
  if (packagesData.packageItemList) {
    packagesData.packageItemList = packagesData.packageItemList.filter(item => {
      return item.level <= 1;
    })
  }
  
  return <PageClient planId={plan} data={packagesData} />;
}
