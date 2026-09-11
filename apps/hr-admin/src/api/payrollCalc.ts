import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 批次狀態：1已計算 2已確認 3已發放 */
export type CalcBatchStatus = 1 | 2 | 3;

/** 收入/扣款明細行 */
export interface AmountLine {
  amount: number;
  name: string;
}

/** 核算批次摘要（對齊後端 CalcBatchVO） */
export interface CalcBatch {
  createTime?: string;
  employeeCount: number;
  id: number;
  period: string;
  remark: string | null;
  status: CalcBatchStatus;
  totalAllowance: number;
  totalBase: number;
  totalBonus: number;
  totalDeduction: number;
  totalEmployerContribution: number;
  totalNet: number;
  totalOvertime: number;
  updateTime?: string;
  warningCount: number;
}

/** 逐員工核算明細（對齊後端 CalcItemVO） */
export interface CalcItem {
  allowances: AmountLine[];
  allowanceTotal: number;
  bankAccount: string | null;
  bankName: string | null;
  baseSalary: number;
  batchId: number;
  bonusTotal: number;
  contractBase: number;
  deductions: AmountLine[];
  departmentName: string | null;
  employeeId: number;
  employeeName: string;
  employeeNo: string | null;
  employerContribution: number;
  id: number;
  itemStatus: number;
  mpfEmp: number;
  nationality: string | null;
  netSalary: number;
  noPayDays: number;
  note: string | null;
  overtimeAmount: number;
  overtimeHours: number;
  paymentType: string | null;
  periodDays: number;
  planId: number | null;
  planName: string | null;
  position: string | null;
  prorationRatio: number;
  retireScheme: string;
  salaryType: string;
  totalDeduction: number;
  totalEarnings: number;
  warnings: string[];
  workedDays: number;
  workedHours: number;
}

/** 批次詳情（對齊後端 CalcBatchDetailVO） */
export interface CalcBatchDetail {
  batch: CalcBatch;
  items: CalcItem[];
}

/** 批次狀態文案 */
export const CALC_STATUS_TEXT: Record<CalcBatchStatus, string> = {
  1: '已計算',
  2: '已確認',
  3: '已發放'
};

/** 核算批次列表（period 可空） */
export function getCalcBatches(period?: string) {
  return request.get<any, ApiResult<CalcBatch[]>>('payroll/calc/list', { params: { period } });
}

/** 批次詳情（含逐員工明細） */
export function getCalcBatchDetail(batchId: number) {
  return request.get<any, ApiResult<CalcBatchDetail>>('payroll/calc/detail', { params: { batchId } });
}

/** 執行核算（新建或重算同月批次，返回批次id） */
export function calculatePayroll(period: string) {
  return request.post<any, ApiResult<number>>('payroll/calc/calculate', null, { params: { period } });
}

/** 確認批次（狀態→已確認，並計入本月獎懲） */
export function confirmCalcBatch(batchId: number) {
  return request.post<any, ApiResult<boolean>>('payroll/calc/confirm', null, { params: { batchId } });
}

/** 刪除批次（僅「已計算」可刪） */
export function deleteCalcBatch(batchId: number) {
  return request.post<any, ApiResult<boolean>>('payroll/calc/delete', null, { params: { batchId } });
}

/** 導出批次明細（返回 blob） */
export function exportCalcBatch(batchId: number) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>('payroll/calc/export', {
    params: { batchId },
    responseType: 'blob'
  });
}
