import { getBaseUrl } from "@/lib/http";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PageClient from "./_page";

export default async function SelectPlanPage({
  params,
}: {
  params: { plan: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value;
  if (!token) {
    return redirect('/account/login')
  }
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
