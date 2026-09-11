import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 班次类型 1.固定班 2.弹性班 3.轮班制 */
export const SCHEDULE_TYPE_TEXT: Record<number, string> = {
  1: "固定班",
  2: "弹性班",
  3: "轮班制",
};

/** 打卡班次（对齐后端 AttendanceScheduleVO） */
export interface AttendanceSchedule {
  id: number;
  name: string;
  /** 1.固定班 2.弹性班 3.轮班制 */
  type: number;
  /** HH:mm */
  workStart?: string;
  workEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  lateGrace?: number;
  earlyLeaveGrace?: number;
  /** 工作日 1=周一..7=周日 */
  workDays?: number[];
  statusCode: number;
  enabled: boolean;
  createdAt?: string;
}

/** 班次下拉选项（员工资料选班次用，仅返回启用的班次） */
export function getScheduleOptions() {
  return request.get<any, ApiResult<AttendanceSchedule[]>>("attendance/schedule/options");
}

/** 班次新增/编辑入参（id 为空表示新增；status 1启用/2停用） */
export interface AttendanceScheduleSave {
  id?: number;
  name: string;
  type: number;
  workStart: string;
  workEnd: string;
  breakStart?: string;
  breakEnd?: string;
  lateGrace?: number;
  earlyLeaveGrace?: number;
  workDays?: number[];
  status?: number;
}

/** 查询班次列表 */
export function getScheduleList(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<AttendanceSchedule[]>>("attendance/schedule/list", { params });
}

/** 新增/编辑班次 */
export function saveSchedule(data: AttendanceScheduleSave) {
  return request.post<any, ApiResult<boolean>>("attendance/schedule/submit", data);
}

/** 删除班次 */
export function deleteSchedule(id: number) {
  return request.post<any, ApiResult<boolean>>("attendance/schedule/delete", null, { params: { id } });
}

/** 打卡规则（对齐后端 AttendanceRuleVO） */
export interface AttendanceRule {
  id: number;
  name: string;
  requirePhoto: boolean;
  requireLocation: boolean;
  allowRemote: boolean;
  missedClockAllowAppeal: boolean;
  appealDeadlineDays: number;
  statusCode: number;
  enabled: boolean;
  createdAt?: string;
}

/** 规则新增/编辑入参 */
export interface AttendanceRuleSave {
  id?: number;
  name: string;
  requirePhoto?: boolean;
  requireLocation?: boolean;
  allowRemote?: boolean;
  missedClockAllowAppeal?: boolean;
  appealDeadlineDays?: number;
  status?: number;
}

/** 查询规则列表 */
export function getRuleList(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<AttendanceRule[]>>("attendance/rule/list", { params });
}

/** 规则下拉选项（地点关联规则用，仅启用） */
export function getRuleOptions() {
  return request.get<any, ApiResult<AttendanceRule[]>>("attendance/rule/options");
}

/** 新增/编辑规则 */
export function saveRule(data: AttendanceRuleSave) {
  return request.post<any, ApiResult<boolean>>("attendance/rule/submit", data);
}

/** 删除规则 */
export function deleteRule(id: number) {
  return request.post<any, ApiResult<boolean>>("attendance/rule/delete", null, { params: { id } });
}

/** 打卡地点（对齐后端 AttendanceLocationVO） */
export interface AttendanceLocation {
  id: number;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  wifiSsid?: string;
  ruleId?: number;
  ruleName?: string;
  statusCode: number;
  enabled: boolean;
  createdAt?: string;
}

/** 地点新增/编辑入参 */
export interface AttendanceLocationSave {
  id?: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  radius?: number;
  wifiSsid?: string;
  ruleId?: number;
  status?: number;
}

/** 查询地点列表 */
export function getLocationList(params?: { keyword?: string; status?: number }) {
  return request.get<any, ApiResult<AttendanceLocation[]>>("attendance/location/list", { params });
}

/** 新增/编辑地点 */
export function saveLocation(data: AttendanceLocationSave) {
  return request.post<any, ApiResult<boolean>>("attendance/location/submit", data);
}

/** 删除地点 */
export function deleteLocation(id: number) {
  return request.post<any, ApiResult<boolean>>("attendance/location/delete", null, { params: { id } });
}

/** 状态码 → 文案（繁体，前端统一口径） */
export const ATTENDANCE_STATUS_TEXT: Record<number, string> = {
  1: "正常",
  2: "遲到",
  3: "早退",
  4: "曠工",
  5: "請假",
  6: "出差",
};

/** 打卡记录（对齐后端 AttendanceRecordVO） */
export interface AttendanceRecordItem {
  id: number;
  employeeId: number;
  name: string;
  department?: string;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm */
  clockIn?: string;
  clockOut?: string;
  statusCode: number;
  status?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
  hoursWorked?: number;
  /** 記錄來源 1.正常打卡 2.補卡補登 3.系統日結 */
  source?: number;
  sourceName?: string;
  /** 日結/補卡會寫明原由 */
  remark?: string;
  /** 上班拍照打卡照片URL */
  clockInPhoto?: string;
  /** 下班拍照打卡照片URL */
  clockOutPhoto?: string;
}

/** 記錄來源碼 */
export const SOURCE_NORMAL = 1;
export const SOURCE_SUPPLEMENT = 2;
export const SOURCE_SETTLE = 3;

/**
 * 月度考勤總覽的休息日格子碼。
 * 「休息」非打卡記錄狀態（資料庫不存），由班次工作日推導，故後端另用 0 表示。
 */
export const CELL_REST = 0;

/** 月度考勤總覽行（對齊後端 MonthlyAttendanceRowVO） */
export interface MonthlyAttendanceRow {
  employeeId: number;
  name: string;
  department?: string;
  /** 日(1~31) → 狀態碼：0休息 1正常 2遲到 3早退 4曠工 5請假 6出差；無此鍵=無資料 */
  days: Record<number, number>;
}

/** 月度考勤總覽（全員 × 當月每日狀態矩陣） */
export function getMonthlyOverview(params: { year: number; month: number; keyword?: string }) {
  return request.get<any, ApiResult<MonthlyAttendanceRow[]>>("attendance/record/monthly", { params });
}

/** 查询打卡记录（HR 端，按年/月/关键字） */
export function getRecordList(params: { year: number; month?: number; keyword?: string }) {
  return request.get<any, ApiResult<AttendanceRecordItem[]>>("attendance/record/list", { params });
}

/** 导出打卡记录 Excel（条件同列表，返回 blob） */
export function exportRecords(params: { year: number; month?: number; keyword?: string }) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>("attendance/record/export", {
    params,
    responseType: "blob",
  });
}
