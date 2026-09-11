import type { AttendanceSchedule } from '@/api/attendance';

/** HH:mm → 分钟数；非法返回 null */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

/** 保留 1 位小数（去尾 0）：8.0→"8"、7.5→"7.5" */
function trim1(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/**
 * 由打卡班次推算工时字段： - 每日工作時數 = (下班-上班) - 午休，单位小时 - 每週工作日數 = 工作日数量 - 每月工作数(時) = 每日 × 每週 × 52 ÷ 12（≈4.333 週/月，与薪资引擎月标准工时口径一致）
 * 缺时间数据的项返回空串，交由调用方决定是否覆盖。
 */
export function deriveWorkHoursFromSchedule(sc?: AttendanceSchedule | null): {
  dailyHours: string;
  monthlyHours: string;
  weeklyDays: string;
} {
  if (!sc) return { dailyHours: '', weeklyDays: '', monthlyHours: '' };

  const start = toMinutes(sc.workStart);
  const end = toMinutes(sc.workEnd);
  let daily = '';
  let dailyNum = 0;
  if (start != null && end != null && end > start) {
    const bStart = toMinutes(sc.breakStart);
    const bEnd = toMinutes(sc.breakEnd);
    const breakMin = bStart != null && bEnd != null && bEnd > bStart ? bEnd - bStart : 0;
    dailyNum = (end - start - breakMin) / 60;
    daily = trim1(dailyNum);
  }

  const weekDayCount = Array.isArray(sc.workDays) ? sc.workDays.length : 0;
  const weekly = weekDayCount > 0 ? String(weekDayCount) : '';

  let monthly = '';
  if (dailyNum > 0 && weekDayCount > 0) {
    monthly = String(Math.round((dailyNum * weekDayCount * 52) / 12));
  }

  return { dailyHours: daily, weeklyDays: weekly, monthlyHours: monthly };
}
