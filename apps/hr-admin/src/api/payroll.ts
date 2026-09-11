import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 明細項類別：1加項(earning) 2減項(deduction) */
export type PlanItemCategory = 1 | 2;
/** 計算方式：1固定額 2百分比 */
export type PlanItemCalcType = 1 | 2;

/** 薪資方案明細項（對齊後端 PlanItemVO / PlanItemDTO） */
export interface PlanItem {
  id?: number;
  name: string;
  category: PlanItemCategory;
  calcType: PlanItemCalcType;
  value: number;
  mpfIncluded: boolean;
  taxable: boolean;
  itemCode?: string | null;
  description?: string | null;
  sort?: number;
}

/** 薪資方案列表項（對齊後端 PayrollPlanVO） */
export interface PayrollPlan {
  id: number;
  name: string;
  code: string;
  baseSalaryMin: number;
  baseSalaryMax: number;
  applicable: string | null;
  description: string | null;
  enabled: boolean;
  // 方案級預設
  currency?: string | null;
  probationRatio?: number | null;
  overtimeBase?: string | null;
  includeBonus?: boolean | null;
  retireRegion?: string | null;
  retireName?: string | null;
  retireEmpRate?: number | null;
  retireEmployerRate?: number | null;
  retireMin?: number | null;
  retireMax?: number | null;
  taxRegion?: string | null;
  /** 計稅方式 1累進/2固定比例/3免稅 */
  taxType?: number | null;
  taxRate?: number | null;
  taxThreshold?: number | null;
  paymentMethod?: string | null;
  payDay?: number | null;
  /** 津貼合計（earning 固定額項之和） */
  allowanceSum: number;
  /** 扣款合計（deduction 固定額項之和） */
  insuranceSum: number;
  /** 適用人數（引用此方案的員工數） */
  applicableCount: number;
  createTime?: string;
  updateTime?: string;
}

/** 薪資方案詳情（列表項 + 明細項） */
export interface PayrollPlanDetail extends PayrollPlan {
  items: PlanItem[];
}

/** 新增/編輯入參（對齊後端 PayrollPlanSaveDTO） */
export interface PayrollPlanSave {
  id?: number;
  name: string;
  code: string;
  baseSalaryMin?: number;
  baseSalaryMax?: number;
  applicable?: string;
  description?: string;
  enabled?: boolean;
  // 方案級預設
  currency?: string;
  probationRatio?: number;
  overtimeBase?: string;
  includeBonus?: boolean;
  retireRegion?: string;
  retireName?: string;
  retireEmpRate?: number;
  retireEmployerRate?: number;
  retireMin?: number;
  retireMax?: number;
  taxRegion?: string;
  /** 計稅方式 1累進/2固定比例/3免稅 */
  taxType?: number;
  taxRate?: number;
  taxThreshold?: number;
  paymentMethod?: string;
  payDay?: number;
  items: PlanItem[];
}

/** 下拉選項（僅啟用） */
export interface PayrollPlanOption {
  id: number;
  name: string;
  code: string;
}

/** 方案列表（keyword 模糊名稱/代碼；status 1啟用 2停用，不傳=全部） */
export function getPayrollPlans(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<PayrollPlan[]>>("payroll/plan/list", { params });
}

/** 方案詳情（含明細項） */
export function getPayrollPlanDetail(id: number) {
  return request.get<any, ApiResult<PayrollPlanDetail>>("payroll/plan/detail", { params: { id } });
}

/** 新增/編輯方案（id 為空新增；明細項整批替換） */
export function savePayrollPlan(payload: PayrollPlanSave) {
  return request.post<any, ApiResult<boolean>>("payroll/plan/submit", payload);
}

/** 啟用/停用方案 */
export function togglePayrollPlan(id: number, enabled: boolean) {
  return request.post<any, ApiResult<boolean>>("payroll/plan/toggle", null, { params: { id, enabled } });
}

/** 刪除方案（適用人數 > 0 時後端攔截） */
export function deletePayrollPlan(id: number) {
  return request.post<any, ApiResult<boolean>>("payroll/plan/delete", null, { params: { id } });
}

/** 方案下拉選項（僅啟用，供員工分配用） */
export function getPayrollPlanOptions() {
  return request.get<any, ApiResult<PayrollPlanOption[]>>("payroll/plan/options");
}

/** 給員工分配方案（planId 為空表示解除分配） */
export function assignPayrollPlan(employeeId: number, planId?: number | null) {
  return request.post<any, ApiResult<boolean>>("payroll/plan/assign", null, { params: { employeeId, planId } });
}
