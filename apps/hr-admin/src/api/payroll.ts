import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 明細項類別：1加項(earning) 2減項(deduction) */
export type PlanItemCategory = 1 | 2;
/** 計算方式：1固定額 2百分比 */
export type PlanItemCalcType = 1 | 2;

/** 薪資方案明細項（對齊後端 PlanItemVO / PlanItemDTO） */
export interface PlanItem {
  calcType: PlanItemCalcType;
  category: PlanItemCategory;
  description?: string | null;
  id?: number;
  itemCode?: string | null;
  mpfIncluded: boolean;
  name: string;
  sort?: number;
  taxable: boolean;
  value: number;
}

/** 薪資方案列表項（對齊後端 PayrollPlanVO） */
export interface PayrollPlan {
  /** 津貼合計（earning 固定額項之和） */
  allowanceSum: number;
  applicable: string | null;
  /** 適用人數（引用此方案的員工數） */
  applicableCount: number;
  baseSalaryMax: number;
  baseSalaryMin: number;
  code: string;
  createTime?: string;
  // 方案級預設
  currency?: string | null;
  description: string | null;
  enabled: boolean;
  id: number;
  includeBonus?: boolean | null;
  /** 扣款合計（deduction 固定額項之和） */
  insuranceSum: number;
  name: string;
  overtimeBase?: string | null;
  payDay?: number | null;
  paymentMethod?: string | null;
  probationRatio?: number | null;
  retireEmployerRate?: number | null;
  retireEmpRate?: number | null;
  retireMax?: number | null;
  retireMin?: number | null;
  retireName?: string | null;
  retireRegion?: string | null;
  taxRate?: number | null;
  taxRegion?: string | null;
  taxThreshold?: number | null;
  /** 計稅方式 1累進/2固定比例/3免稅 */
  taxType?: number | null;
  updateTime?: string;
}

/** 薪資方案詳情（列表項 + 明細項） */
export interface PayrollPlanDetail extends PayrollPlan {
  items: PlanItem[];
}

/** 新增/編輯入參（對齊後端 PayrollPlanSaveDTO） */
export interface PayrollPlanSave {
  applicable?: string;
  baseSalaryMax?: number;
  baseSalaryMin?: number;
  code: string;
  // 方案級預設
  currency?: string;
  description?: string;
  enabled?: boolean;
  id?: number;
  includeBonus?: boolean;
  items: PlanItem[];
  name: string;
  overtimeBase?: string;
  payDay?: number;
  paymentMethod?: string;
  probationRatio?: number;
  retireEmployerRate?: number;
  retireEmpRate?: number;
  retireMax?: number;
  retireMin?: number;
  retireName?: string;
  retireRegion?: string;
  taxRate?: number;
  taxRegion?: string;
  taxThreshold?: number;
  /** 計稅方式 1累進/2固定比例/3免稅 */
  taxType?: number;
}

/** 下拉選項（僅啟用） */
export interface PayrollPlanOption {
  code: string;
  id: number;
  name: string;
}

/** 方案列表（keyword 模糊名稱/代碼；status 1啟用 2停用，不傳=全部） */
export function getPayrollPlans(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<PayrollPlan[]>>('payroll/plan/list', { params });
}

/** 方案詳情（含明細項） */
export function getPayrollPlanDetail(id: number) {
  return request.get<any, ApiResult<PayrollPlanDetail>>('payroll/plan/detail', { params: { id } });
}

/** 新增/編輯方案（id 為空新增；明細項整批替換） */
export function savePayrollPlan(payload: PayrollPlanSave) {
  return request.post<any, ApiResult<boolean>>('payroll/plan/submit', payload);
}

/** 啟用/停用方案 */
export function togglePayrollPlan(id: number, enabled: boolean) {
  return request.post<any, ApiResult<boolean>>('payroll/plan/toggle', null, { params: { id, enabled } });
}

/** 刪除方案（適用人數 > 0 時後端攔截） */
export function deletePayrollPlan(id: number) {
  return request.post<any, ApiResult<boolean>>('payroll/plan/delete', null, { params: { id } });
}

/** 方案下拉選項（僅啟用，供員工分配用） */
export function getPayrollPlanOptions() {
  return request.get<any, ApiResult<PayrollPlanOption[]>>('payroll/plan/options');
}

/** 給員工分配方案（planId 為空表示解除分配） */
export function assignPayrollPlan(employeeId: number, planId?: number | null) {
  return request.post<any, ApiResult<boolean>>('payroll/plan/assign', null, { params: { employeeId, planId } });
}
