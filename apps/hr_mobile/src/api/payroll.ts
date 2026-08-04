import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 金额明细行（对齐后端 AmountLineVO） */
export interface AmountLine {
  name: string;
  amount: number;
}

/** 我的粮单（对齐后端 MyPayslipVO） */
export interface Payslip {
  period: string;
  grossPay: number;
  totalDeduction: number;
  netPay: number;
  /** 批次状态码 2已確認 3已發放 */
  statusCode?: number;
  status?: string;
  incomes: AmountLine[];
  deductions: AmountLine[];
}

/** 当前登录员工的粮单列表（已確認/已發放，按期间倒序） */
export function getMyPayslips() {
  return request.get<any, ApiResult<Payslip[]>>("payroll/calc/my");
}
