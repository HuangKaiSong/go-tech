import { type PromotionOption, toArray } from '@/app/constants/promotion';
import { httpClient } from '@/lib/http';
import PageClient from './_page';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  let detail = null;

  try {
    const data = await httpClient.get(`/go-tech/platform/packageOrder/detail/${id}`);
    detail = data.data;
  } catch (error) {
    console.error(error);
    detail = null;
  }

  // 获取当前套餐可用的优惠活动
  let promotions: PromotionOption[] = [];
  const packageId = detail?.platformPackageDto?.id;
  if (packageId) {
    try {
      const res = await httpClient.get(`/go-tech/platform/promotion/search?packageId=${packageId}`);
      promotions = toArray<PromotionOption>(res?.data);
    } catch (error) {
      console.error(error);
    }
  }

  return <PageClient id={id} detail={detail} promotions={promotions} />;
}
