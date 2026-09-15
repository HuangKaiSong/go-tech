'use client';

import { type PromotionOption, toArray } from '@/app/constants/promotion';
import { clientFetch } from '@/lib/client-http/client-fetch';

/** 客户端后台查询可用优惠活动；失败返回空数组，不打断订单流程。 */
export async function fetchPromotions(
  packageId: number | string | undefined,
  token?: string
): Promise<PromotionOption[]> {
  if (!packageId) return [];

  try {
    const response = await clientFetch(
      `/go-tech/platform/promotion/search?packageCode=${packageId}`,
      {
        headers: { Authorization: `Bearer ${token}`, 'User-Type': 'platform_customer' }
      },
      { feedback: 'silent' }
    );
    const result = await response.json();
    return toArray<PromotionOption>(result?.data);
  } catch {
    return [];
  }
}
