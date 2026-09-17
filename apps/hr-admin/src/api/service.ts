import request from '@/lib/request';
import type { ApiResult } from '@/api/employee';

/** 基础服务到期信息 */
export interface ServiceExpiry {
  /** 服務項名稱 */
  serviceItem: string;
  /** 過期日期 yyyy-MM-dd */
  expireDate: string;
  /** 剩餘天數（負數表示已過期） */
  remainingDays: number;
  /** 是否已過期 */
  expired: boolean;
  /** 是否需要提示 */
  warning: boolean;
  /** 续费跳转链接（跳平台首页，用户自行续费） */
  renewUrl?: string;
}

/** 查询当前租户基础服务到期信息（顶栏提示用）。无套餐记录时 data 为 null */
export function getServiceExpiry() {
  return request.get<any, ApiResult<ServiceExpiry | null>>('service/expiry');
}
