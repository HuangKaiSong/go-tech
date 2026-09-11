import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 批次狀態：1已計算 2已確認 3已發放 */
export type CalcBatchStatus = 1 | 2 | 3;

/** 收入/扣款明細行 */
export interface AmountLine {
  name: string;
  amount: number;
}

/** 核算批次摘要（對齊後端 CalcBatchVO） */
export interface CalcBatch {
  id: number;
  period: string;
  status: CalcBatchStatus;
  employeeCount: number;
  totalBase: number;
  totalAllowance: number;
  totalBonus: number;
  totalOvertime: number;
  totalDeduction: number;
  totalNet: number;
  totalEmployerContribution: number;
  warningCount: number;
  remark: string | null;
  createTime?: string;
  updateTime?: string;
}

/** 逐員工核算明細（對齊後端 CalcItemVO） */
export interface CalcItem {
  id: number;
  batchId: number;
  employeeId: number;
  employeeNo: string | null;
  employeeName: string;
  departmentName: string | null;
  position: string | null;
  paymentType: string | null;
  bankName: string | null;
  bankAccount: string | null;
  nationality: string | null;
  planId: number | null;
  planName: string | null;
  salaryType: string;
  contractBase: number;
  baseSalary: number;
  allowanceTotal: number;
  bonusTotal: number;
  overtimeHours: number;
  overtimeAmount: number;
  retireScheme: string;
  mpfEmp: number;
  employerContribution: number;
  periodDays: number;
  workedDays: number;
  workedHours: number;
  noPayDays: number;
  prorationRatio: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  allowances: AmountLine[];
  deductions: AmountLine[];
  warnings: string[];
  itemStatus: number;
  note: string | null;
}

/** 批次詳情（對齊後端 CalcBatchDetailVO） */
export interface CalcBatchDetail {
  batch: CalcBatch;
  items: CalcItem[];
}

/** 批次狀態文案 */
export const CALC_STATUS_TEXT: Record<CalcBatchStatus, string> = {
  1: "已計算",
  2: "已確認",
  3: "已發放",
};

/** 核算批次列表（period 可空） */
export function getCalcBatches(period?: string) {
  return request.get<any, ApiResult<CalcBatch[]>>("payroll/calc/list", { params: { period } });
}

/** 批次詳情（含逐員工明細） */
export function getCalcBatchDetail(batchId: number) {
  return request.get<any, ApiResult<CalcBatchDetail>>("payroll/calc/detail", { params: { batchId } });
}

/** 執行核算（新建或重算同月批次，返回批次id） */
export function calculatePayroll(period: string) {
  return request.post<any, ApiResult<number>>("payroll/calc/calculate", null, { params: { period } });
}

/** 確認批次（狀態→已確認，並計入本月獎懲） */
export function confirmCalcBatch(batchId: number) {
  return request.post<any, ApiResult<boolean>>("payroll/calc/confirm", null, { params: { batchId } });
}

/** 刪除批次（僅「已計算」可刪） */
export function deleteCalcBatch(batchId: number) {
  return request.post<any, ApiResult<boolean>>("payroll/calc/delete", null, { params: { batchId } });
}

/** 導出批次明細（返回 blob） */
export function exportCalcBatch(batchId: number) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>("payroll/calc/export", {
    params: { batchId },
    responseType: "blob",
  });
}
