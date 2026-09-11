import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 名稱-數值對（部門人數 / 性別 / 狀態分布 / 績效等級等通用結構） */
export interface NameValue {
  name: string;
  value: number;
}

/** 入離職趨勢單點 */
export interface TrendPoint {
  month: string;
  hires: number;
  leaves: number;
}

/** 頂部 KPI（含較上月變化） */
export interface DashboardKpi {
  totalEmployees: number;
  totalEmployeesDelta: number;
  hiresThisMonth: number;
  hiresDelta: number;
  leavesThisMonth: number;
  leavesDelta: number;
  /** 出勤率百分比，如 96.5 */
  attendanceRate: number;
  attendanceRateDelta: number;
}

/** 待辦中心計數 */
export interface DashboardTodos {
  myApprovals: number;
  /** 待審批分類文字，如「請假 4 · 加班 2 · 報銷 1」，可為空 */
  approvalBreakdown: string;
  onboarding: number;
  offboarding: number;
  perfCalibration: number;
  trainingDraft: number;
}

/** 薪資批次審批節點 */
export interface PayrollStep {
  name: string;
  done: boolean;
  current: boolean;
}

/** 本月薪資批次概覽（無權限或無批次時後端返回 null） */
export interface DashboardPayroll {
  period: string;
  steps: PayrollStep[];
  statusText: string;
  grossTotal: string;
  laborCost: string;
  anomalies: number;
}

/** 最近動態單條 */
export interface DashboardActivity {
  type: string;
  title: string;
  detail: string;
  time: string;
}

/** 儀表板總覽（一次性返回所有卡片數據；後端按當前用戶職位權限裁剪，無權限的區塊返回 null/空） */
export interface DashboardOverview {
  kpi: DashboardKpi;
  todos: DashboardTodos;
  statusDist: NameValue[];
  deptHeadcount: NameValue[];
  genderRatio: NameValue[];
  hireLeaveTrend: TrendPoint[];
  gradeDist: NameValue[];
  payroll: DashboardPayroll | null;
  unreadCount: number;
  activities: DashboardActivity[];
}

/** 取儀表板總覽數據 */
export function getDashboardOverview() {
  return request.get<any, ApiResult<DashboardOverview>>("dashboard/overview");
}
