import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 類型：1獎金 2罰款 */
export type BonusPenaltyType = 1 | 2;
/** 狀態：1未計入 2已計入 3已取消 */
export type BonusPenaltyStatus = 1 | 2 | 3;

/** 奖惩記錄（對齊後端 BonusPenaltyVO） */
export interface BonusPenalty {
  id: number;
  type: BonusPenaltyType;
  category: string;
  employeeId: number;
  employeeName: string | null;
  departmentName: string | null;
  amount: number;
  applyMonth: string;
  reason: string | null;
  note: string | null;
  status: BonusPenaltyStatus;
  calcBatchId: number | null;
  createTime?: string;
}

/** 新增/編輯入參（對齊後端 BonusPenaltySaveDTO） */
export interface BonusPenaltySave {
  id?: number;
  type: BonusPenaltyType;
  category: string;
  employeeId: number;
  amount: number;
  applyMonth: string;
  reason?: string;
  note?: string;
}

/** 某月合計（對齊後端 BonusPenaltyStatVO） */
export interface BonusPenaltyStat {
  applyMonth: string;
  bonusTotal: number;
  penaltyTotal: number;
  bonusCount: number;
  penaltyCount: number;
}

/** 列表（keyword 模糊 姓名/部門/類別；type/status/applyMonth 皆可空） */
export function getBonusPenaltyList(params?: { keyword?: string; type?: number; status?: number; applyMonth?: string }) {
  return request.get<any, ApiResult<BonusPenalty[]>>("payroll/bonusPenalty/list", { params });
}

/** 詳情 */
export function getBonusPenaltyDetail(id: number) {
  return request.get<any, ApiResult<BonusPenalty>>("payroll/bonusPenalty/detail", { params: { id } });
}

/** 新增/編輯（id 為空新增；僅「未計入」可編輯） */
export function submitBonusPenalty(payload: BonusPenaltySave) {
  return request.post<any, ApiResult<boolean>>("payroll/bonusPenalty/submit", payload);
}

/** 取消（僅「未計入」可取消） */
export function cancelBonusPenalty(id: number) {
  return request.post<any, ApiResult<boolean>>("payroll/bonusPenalty/cancel", null, { params: { id } });
}

/** 刪除（僅「未計入」可刪除） */
export function deleteBonusPenalty(id: number) {
  return request.post<any, ApiResult<boolean>>("payroll/bonusPenalty/delete", null, { params: { id } });
}

/** 某月合計（核算引擎用，僅統計「未計入」） */
export function getBonusPenaltyStat(applyMonth: string) {
  return request.get<any, ApiResult<BonusPenaltyStat>>("payroll/bonusPenalty/statByMonth", { params: { applyMonth } });
}
