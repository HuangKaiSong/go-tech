import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 账本流水類型碼 */
export const LEDGER_TYPE = {
  GRANT: 1, USE: 2, CARRY_IN: 3, EXPIRE: 4, CASH_OUT: 5, ADJUST: 6, REVERSE: 7,
} as const;

/** 員工額度彙總（對齊後端 LeaveBalanceVO；由账本聚合，非快照） */
export interface LeaveBalance {
  employeeId: number;
  employeeName: string;
  departmentName?: string;
  leaveCode: string;
  /** 累計發放（含結轉入） */
  granted: number;
  used: number;
  expired: number;
  cashedOut: number;
  adjusted: number;
  remaining: number;
  /** 最近一筆將過期的天數/日期 */
  expiringDays?: number | null;
  expiringDate?: string | null;
}

/** 账本流水行（對齊後端 LeaveLedgerVO） */
export interface LeaveLedgerRow {
  id: number;
  txnType: number;
  txnTypeName: string;
  days: number;
  effectiveDate?: string;
  expireDate?: string | null;
  bucketId?: number | null;
  period?: string | null;
  sourceRef?: string | null;
  remark?: string | null;
  createdAt?: string;
}

/** 手工調整入參（正=補發 負=扣減，必填原因） */
export interface LeaveAdjustPayload {
  employeeId: number;
  leaveCode?: string;
  days: number;
  /** 僅補發可填，留空=永不過期 */
  expireDate?: string;
  remark: string;
}

/** 員工額度彙總列表 */
export function getLeaveBalances(params?: { leaveCode?: string; keyword?: string }) {
  return request.get<any, ApiResult<LeaveBalance[]>>("leave/balance/list", { params });
}

/** 某員工的額度账本流水（倒序） */
export function getLeaveLedger(employeeId: number, leaveCode?: string) {
  return request.get<any, ApiResult<LeaveLedgerRow[]>>("leave/balance/ledger", {
    params: { employeeId, leaveCode },
  });
}

/** 手工調整額度 */
export function adjustLeaveBalance(payload: LeaveAdjustPayload) {
  return request.post<any, ApiResult<boolean>>("leave/balance/adjust", payload);
}

/** 手動補跑年假發放（冪等，可重複執行） */
export function accrueLeave(date?: string) {
  return request.post<any, ApiResult<number>>("leave/balance/accrue", null, { params: { date } });
}

/** 手動處理過期與結轉 */
export function expireLeave(date?: string) {
  return request.post<any, ApiResult<number>>("leave/balance/expire", null, { params: { date } });
}
