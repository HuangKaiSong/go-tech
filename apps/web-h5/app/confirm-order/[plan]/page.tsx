import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type PromotionOption, toArray } from '@/app/constants/promotion';
import { getBaseUrl } from '@/lib/http';
import PageClient from './_page';

export default async function ConfirmOrderPage({ params }: { params: { plan: string } | Promise<{ plan: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value;
  if (!token) {
    return redirect('/account/login');
  }

  const { plan } = await params;
  const baseUrl = getBaseUrl();

  const packagesResponse = (await fetch(`${baseUrl}/go-tech/platform/platformPackage/detail/${plan}`).then(res =>
    res.json()
  )) as HttpBaseResponse<Packages>;
  const packagesData = packagesResponse.data as Packages;
  if (packagesData.packageItemList) {
    packagesData.packageItemList = packagesData.packageItemList.filter(item => {
      return item.level <= 1;
    });
  }

  // 获取当前套餐可用的优惠活动
  let promotions: PromotionOption[] = [];
  try {
    const promotionResponse = (await fetch(`${baseUrl}/go-tech/platform/promotion/search?packageId=${plan}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Type': 'platform_customer' }
    }).then(res => res.json())) as HttpBaseResponse<PromotionOption | PromotionOption[]>;
    promotions = toArray<PromotionOption>(promotionResponse?.data);
  } catch {
    // 忽略：优惠获取失败不影响下单
  }

  return <PageClient planId={plan} data={packagesData} promotions={promotions} />;
}
