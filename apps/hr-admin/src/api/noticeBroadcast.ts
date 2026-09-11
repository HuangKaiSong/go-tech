import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 群发通知（对齐后端 NoticeBroadcastVO） */
export interface NoticeBroadcast {
  content: string;
  createdBy: string;
  createTime: string;
  id: string;
  noticeType: string;
  priority: string;
  readCount: number;
  /** 0草稿 1已發送 */
  sendStatus: number;
  sendStatusText: string;
  sentTime: string | null;
  targetIds: number[];
  targetNames: string[];
  /** 对象类型 code：COMPANY / DEPT / USER */
  targetType: string;
  /** 对象类型文本：全公司 / 部門 / 指定人員 */
  targetTypeText: string;
  title: string;
  totalCount: number;
}

/** 保存入参（对齐后端 NoticeBroadcastSaveDTO） */
export interface NoticeBroadcastSave {
  content: string;
  id?: number;
  noticeType: string;
  priority: string;
  targetIds?: number[];
  targetNames?: string[];
  targetType: string;
  title: string;
}

/** 通知列表（按id倒序，含已读/总数） */
export function getNoticeList() {
  return request.get<any, ApiResult<NoticeBroadcast[]>>('notice-broadcast/list');
}

/** 通知详情 */
export function getNoticeDetail(id: number) {
  return request.get<any, ApiResult<NoticeBroadcast>>('notice-broadcast/detail', { params: { id } });
}

/** 保存草稿（新建/编辑） */
export function saveNotice(data: NoticeBroadcastSave) {
  return request.post<any, ApiResult<string>>('notice-broadcast/save', data);
}

/** 保存并立即发送 */
export function saveAndSendNotice(data: NoticeBroadcastSave) {
  return request.post<any, ApiResult<string>>('notice-broadcast/saveAndSend', data);
}

/** 发送已存草稿 */
export function sendNotice(id: number) {
  return request.post<any, ApiResult<boolean>>('notice-broadcast/send', null, { params: { id } });
}

/** 删除通知 */
export function deleteNotice(id: number) {
  return request.post<any, ApiResult<boolean>>('notice-broadcast/delete', null, { params: { id } });
}
