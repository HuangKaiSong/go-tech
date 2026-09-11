import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";
import type { CalcBatch } from "@/api/payrollCalc";

/** 發放批次狀態：1草稿 2待審核 3已審核 4發放中 5已發放 6已取消 */
export type DistStatus = 1 | 2 | 3 | 4 | 5 | 6;
/** 明細發放狀態：1待發放 2已發放 3失敗 4已取消 */
export type PayStatus = 1 | 2 | 3 | 4;

export const DIST_STATUS_TEXT: Record<DistStatus, string> = {
  1: "草稿", 2: "待審核", 3: "已審核", 4: "發放中", 5: "已發放", 6: "已取消",
};

export const PAY_STATUS_TEXT: Record<PayStatus, string> = {
  1: "待發放", 2: "已發放", 3: "發放失敗", 4: "已取消",
};

/**
 * 審批層級標題兜底（後端無「薪資發放」規則時的展示回退）。
 * 實際級數/級名以 getDistLevels() 返回的規則配置為準——配幾級就幾級。
 */
export const APPROVAL_LEVEL_TITLES = ["部門主管初審", "財務經理複審", "人事經理審核", "總經理終審"];

/** 發放批次（對齊後端 DistBatchVO） */
export interface DistBatch {
  id: number;
  calcBatchId: number;
  period: string;
  payrollGroup: string;
  status: DistStatus;
  approvalLevel: number;
  /** 轉簽指定審批人id（移交，非空表示當前級已轉簽） */
  delegateApproverId?: number | null;
  /** 轉簽指定審批人姓名 */
  delegateApproverName?: string | null;
  employeeCount: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  totalEmployerContribution: number;
  payDate: string | null;
  payMethod: string | null;
  payBank: string | null;
  createUserName: string | null;
  approvedByName: string | null;
  note: string | null;
  createTime?: string;
  updateTime?: string;
}

/** 發放明細（對齊後端 DistItemVO） */
export interface DistItem {
  id: number;
  batchId: number;
  employeeId: number;
  employeeNo: string | null;
  employeeName: string;
  departmentName: string | null;
  position: string | null;
  payrollGroup: string | null;
  paymentType: string | null;
  bankName: string | null;
  bankAccount: string | null;
  grossSalary: number;
  deduction: number;
  netSalary: number;
  employerContribution: number;
  payStatus: PayStatus;
  payTime: string | null;
  transactionId: string | null;
}

/** 審批日誌（對齊後端 ApprovalLogVO） */
export interface ApprovalLog {
  id: number;
  batchId: number;
  period?: string | null;
  action: string;
  operator: string;
  role: string;
  level: number;
  comment: string | null;
  time: string;
}

/** 異動項（對齊後端 AnomalyVO） */
export interface Anomaly {
  employeeId: number;
  name: string;
  department: string;
  type: string;
  description: string;
  amount: number;
  severity: "info" | "warning" | "error";
}

/** 批次詳情（對齊後端 DistBatchDetailVO） */
export interface DistBatchDetail {
  batch: DistBatch;
  totalLevels: number;
  items: DistItem[];
  logs: ApprovalLog[];
  anomalies: Anomaly[];
}

/** 生成發放入參 */
export interface DistGeneratePayload {
  calcBatchId: number;
  payDate: string;
  payMethod: string;
  payBank: string;
  payrollGroup?: string;
  employeeIds?: number[];
  note?: string;
}

export function getDistBatches(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<DistBatch[]>>("payroll/dist/list", { params });
}

export function getPendingDistBatches() {
  return request.get<any, ApiResult<DistBatch[]>>("payroll/dist/pending");
}

export function getDistBatchDetail(batchId: number) {
  return request.get<any, ApiResult<DistBatchDetail>>("payroll/dist/detail", { params: { batchId } });
}

/** 審核記錄（全局審批日誌；keyword 配對期間/操作人，action 篩選操作） */
export function getDistLogs(params?: { keyword?: string; action?: string }) {
  return request.get<any, ApiResult<ApprovalLog[]>>("payroll/dist/logs", { params });
}

/** 可生成發放的核算批次（已確認且未生成發放） */
/** 當前「薪資發放」審批規則各級標題（跟隨審批管理配置；配幾級就幾級） */
export function getDistLevels() {
  return request.get<any, ApiResult<string[]>>("payroll/dist/levels");
}

export function getGeneratableCalcBatches() {
  return request.get<any, ApiResult<CalcBatch[]>>("payroll/dist/generatable");
}

export function generateDist(payload: DistGeneratePayload) {
  return request.post<any, ApiResult<number>>("payroll/dist/generate", payload);
}

export function submitDist(batchId: number) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/submit", null, { params: { batchId } });
}

export function approveDist(batchId: number, comment?: string) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/approve", { batchId, comment });
}

export function rejectDist(batchId: number, comment: string) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/reject", { batchId, comment });
}

export function returnDist(batchId: number, comment: string) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/return", { batchId, comment });
}

/** 轉簽（移交）：把當前級審核任務移交給指定在職員工 */
export function reassignDist(batchId: number, targetUserId: number, comment?: string) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/reassign", { batchId, targetUserId, comment });
}

export function cancelDist(batchId: number) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/cancel", null, { params: { batchId } });
}

export function executeDist(batchId: number) {
  return request.post<any, ApiResult<boolean>>("payroll/dist/execute", null, { params: { batchId } });
}
