import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 今日打卡状态（对齐后端 ClockTodayVO） */
export interface ClockToday {
  date: string;
  scheduleName?: string;
  /** HH:mm */
  workStart?: string;
  workEnd?: string;
  lateGrace?: number;
  earlyLeaveGrace?: number;
  clockIn?: string;
  clockOut?: string;
  /** 1正常 2迟到 3早退 4缺勤 5请假 6出差 */
  statusCode?: number;
  statusText?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
  hoursWorked?: number;
  locationName?: string;
  canClockIn: boolean;
  canClockOut: boolean;
  /** 打卡接口返回的本次提示 */
  message?: string;
}

/** 打卡入参（经纬度可空） */
export interface ClockParams {
  lat?: number;
  lng?: number;
  remark?: string;
}

/** 查询今日打卡状态 */
export function getTodayClock() {
  return request.get<any, ApiResult<ClockToday>>("attendance/clock/today");
}

/** 打卡（自动判定上班/下班） */
export function punchClock(data: ClockParams) {
  return request.post<any, ApiResult<ClockToday>>("attendance/clock/punch", data);
}

/** 考勤历史记录（对齐后端 AttendanceRecordVO，员工自身） */
export interface ClockHistoryItem {
  id: number;
  date: string;
  clockIn?: string;
  clockOut?: string;
  statusCode: number;
  status?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
  hoursWorked?: number;
}

/** 我的考勤历史（某年，可选某月；不传默认当年全部） */
export function getClockHistory(params?: { year?: number; month?: number }) {
  return request.get<any, ApiResult<ClockHistoryItem[]>>("attendance/clock/history", { params });
}
