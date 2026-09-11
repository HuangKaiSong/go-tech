import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 名稱-數值對（部門人數 / 性別 / 狀態分布 / 績效等級等通用結構） */
export interface NameValue {
  name: string;
  value: number;
}

/** 入離職趨勢單點 */
export interface TrendPoint {
  hires: number;
  leaves: number;
  month: string;
}

/** 頂部 KPI（含較上月變化） */
export interface DashboardKpi {
  /** 出勤率百分比，如 96.5 */
  attendanceRate: number;
  attendanceRateDelta: number;
  hiresDelta: number;
  hiresThisMonth: number;
  leavesDelta: number;
  leavesThisMonth: number;
  totalEmployees: number;
  totalEmployeesDelta: number;
}

/** 待辦中心計數 */
export interface DashboardTodos {
  /** 待審批分類文字，如「請假 4 · 加班 2 · 報銷 1」，可為空 */
  approvalBreakdown: string;
  myApprovals: number;
  offboarding: number;
  onboarding: number;
  perfCalibration: number;
  trainingDraft: number;
}

/** 薪資批次審批節點 */
export interface PayrollStep {
  current: boolean;
  done: boolean;
  name: string;
}

/** 本月薪資批次概覽（無權限或無批次時後端返回 null） */
export interface DashboardPayroll {
  anomalies: number;
  grossTotal: string;
  laborCost: string;
  period: string;
  statusText: string;
  steps: PayrollStep[];
}

/** 最近動態單條 */
export interface DashboardActivity {
  detail: string;
  time: string;
  title: string;
  type: string;
}

/** 儀表板總覽（一次性返回所有卡片數據；後端按當前用戶職位權限裁剪，無權限的區塊返回 null/空） */
export interface DashboardOverview {
  activities: DashboardActivity[];
  deptHeadcount: NameValue[];
  genderRatio: NameValue[];
  gradeDist: NameValue[];
  hireLeaveTrend: TrendPoint[];
  kpi: DashboardKpi;
  payroll: DashboardPayroll | null;
  statusDist: NameValue[];
  todos: DashboardTodos;
  unreadCount: number;
}

/** 取儀表板總覽數據 */
export function getDashboardOverview() {
  return request.get<any, ApiResult<DashboardOverview>>('dashboard/overview');
}
