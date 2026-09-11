import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 計算單位 */
export type LeaveUnit = "day" | "half" | "hour";
/** 年假發放週期 */
export type AccrualMode = "anniversary" | "calendar" | "monthly";

/** 假別類型（對齊後端 LeaveTypeVO） */
export interface LeaveType {
  id?: number;
  code: string;
  name: string;
  icon: string;
  unit: LeaveUnit;
  paid: boolean;
  deductFromAnnual: boolean;
  requireProof: boolean;
  proofThresholdDays: number;
  maxPerYear: number | null;
  maxPerRequest: number | null;
  advanceApplyDays: number;
  color: string;
  description: string;
  sort?: number;
  enabled: boolean;
}

/** 年資階梯（對齊後端 LeaveAnnualTierVO） */
export interface AnnualTier {
  id?: number;
  minYears: number;
  maxYears: number | null;
  days: number;
}

/** 年假政策（對齊後端 LeaveAnnualPolicyVO；id 為 null 表示尚未保存過） */
export interface AnnualPolicy {
  id?: number | null;
  accrualMode: AccrualMode;
  proRateFirstYear: boolean;
  probationEligible: boolean;
  probationMonths: number;
  carryOverEnabled: boolean;
  carryOverMaxDays: number;
  carryOverExpireMonths: number;
  cashOutEnabled: boolean;
  cashOutMaxDays: number;
  minRequestUnit: LeaveUnit;
  advanceRequestDays: number;
  blackoutDates: string;
  tiers: AnnualTier[];
}

// ---------- 假別類型 ----------

/** 假別列表（onlyEnabled=true 僅返回啟用，供請假單下拉） */
export function getLeaveTypes(onlyEnabled = false) {
  return request.get<any, ApiResult<LeaveType[]>>("leave/setting/type/list", { params: { onlyEnabled } });
}

/** 新增/編輯假別（id 為空為新增） */
export function saveLeaveType(payload: LeaveType) {
  return request.post<any, ApiResult<boolean>>("leave/setting/type/submit", payload);
}

/** 啟用/停用假別 */
export function toggleLeaveType(id: number, enabled: boolean) {
  return request.post<any, ApiResult<boolean>>("leave/setting/type/toggle", null, { params: { id, enabled } });
}

/** 刪除假別 */
export function deleteLeaveType(id: number) {
  return request.post<any, ApiResult<boolean>>("leave/setting/type/delete", null, { params: { id } });
}

// ---------- 年假政策 ----------

/** 取年假政策（含年資階梯；未設定過返回默認值） */
export function getAnnualPolicy() {
  return request.get<any, ApiResult<AnnualPolicy>>("leave/setting/annual/get");
}

/** 保存年假政策（政策 upsert + 年資階梯整批替換） */
export function saveAnnualPolicy(payload: AnnualPolicy) {
  return request.post<any, ApiResult<boolean>>("leave/setting/annual/save", payload);
}
