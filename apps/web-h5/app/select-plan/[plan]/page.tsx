import { getBaseUrl } from "@/lib/http";
import PageClient from "./_page";

export default async function SelectPlanPage({
  params,
}: {
  params: { plan: string };
}) {
  const { plan } = await params;
  const baseUrl = getBaseUrl();
  const packagesData = await fetch(`${baseUrl}/go-tech/platform/platformPackage/enabledList`, { next: { revalidate: 300 } }).then(res => res.json()) as HttpBaseResponse<Packages[]>;

  const packages = packagesData?.data?.find(item => item.id.toString() === plan) as Packages

  return <PageClient plan={packages} />;
}
