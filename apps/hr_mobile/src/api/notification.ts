import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 站内通知（对齐后端 NotificationVO） */
export interface AppNotification {
  id: number;
  /** APPROVAL/PAYROLL/ATTENDANCE/ONBOARDING/SYSTEM */
  type: string;
  title: string;
  content?: string;
  bizType?: string;
  bizId?: number;
  read: boolean;
  createTime: string;
}

/** 我的通知（onlyUnread=true 仅未读） */
export function getMyNotifications(onlyUnread?: boolean) {
  return request.get<any, ApiResult<AppNotification[]>>("notification/my", {
    params: onlyUnread ? { onlyUnread: true } : undefined,
  });
}

/** 未读数 */
export function getUnreadCount() {
  return request.get<any, ApiResult<number>>("notification/unreadCount");
}

/** 标记单条已读 */
export function markNotificationRead(id: number) {
  return request.post<any, ApiResult<boolean>>("notification/read", null, { params: { id } });
}

/** 全部标为已读 */
export function markAllNotificationsRead() {
  return request.post<any, ApiResult<boolean>>("notification/readAll");
}
