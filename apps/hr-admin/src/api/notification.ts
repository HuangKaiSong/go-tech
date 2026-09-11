import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 站内通知（对齐后端 NotificationVO） */
export interface AppNotification {
  bizId?: string;
  bizType?: string;
  content?: string;
  createTime: string;
  id: string;
  read: boolean;
  title: string;
  /** APPROVAL/PAYROLL/ATTENDANCE/ONBOARDING/SYSTEM */
  type: string;
}

/** 我的通知（onlyUnread=true 仅未读） */
export function getMyNotifications(onlyUnread?: boolean) {
  return request.get<any, ApiResult<AppNotification[]>>('notification/my', {
    params: onlyUnread ? { onlyUnread: true } : undefined
  });
}

/** 未读数 */
export function getUnreadCount() {
  return request.get<any, ApiResult<number>>('notification/unreadCount');
}

/** 标记单条已读 */
export function markNotificationRead(id: number) {
  return request.post<any, ApiResult<boolean>>('notification/read', null, { params: { id } });
}

/** 全部标为已读 */
export function markAllNotificationsRead() {
  return request.post<any, ApiResult<boolean>>('notification/readAll');
}
