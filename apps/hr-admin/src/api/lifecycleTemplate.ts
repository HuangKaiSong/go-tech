import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 業務類型：入職 / 離職 */
export const LIFECYCLE_BIZ = { ONBOARDING: 1, OFFBOARDING: 2 } as const;

/** 任務模板行（對齊後端 LifecycleTaskTemplateVO） */
export interface TaskTemplate {
  /** 負責方 1.HR 2.員工 */
  assigneeType: number;
  bizType: number;
  category: string;
  /** 截止日相對入/離職日的偏移天數 */
  dueOffsetDays: number;
  /** 是否啟用 1.啟用 0.停用 */
  enabled: number;
  id: number;
  name: string;
  sort: number;
  updateTime?: string;
}

/** 新增/編輯任務模板入參（id 為空為新增） */
export interface TaskTemplateSavePayload {
  assigneeType: number;
  bizType: number;
  category: string;
  dueOffsetDays?: number;
  enabled?: number;
  id?: number;
  name: string;
  sort?: number;
}

/** 按業務類型查任務模板列表（含停用） */
export function getTaskTemplates(bizType: number) {
  return request.get<any, ApiResult<TaskTemplate[]>>('lifecycleTemplate/list', { params: { bizType } });
}

/** 新增/編輯任務模板 */
export function saveTaskTemplate(payload: TaskTemplateSavePayload) {
  return request.post<any, ApiResult<boolean>>('lifecycleTemplate/save', payload);
}

/** 啟用/停用任務模板 */
export function toggleTaskTemplate(id: number, enabled: number) {
  return request.post<any, ApiResult<boolean>>('lifecycleTemplate/toggle', null, { params: { id, enabled } });
}

/** 刪除任務模板 */
export function deleteTaskTemplate(id: number) {
  return request.post<any, ApiResult<boolean>>('lifecycleTemplate/delete', null, { params: { id } });
}

/** 恢復默認清單（清空該業務類型現有模板並寫入內置默認） */
export function resetTaskTemplates(bizType: number) {
  return request.post<any, ApiResult<boolean>>('lifecycleTemplate/resetDefault', null, { params: { bizType } });
}
