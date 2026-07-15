import { transformRecordToOption } from '@/utils/common';

/** 班次类型 → i18n 键 */
export const scheduleTypeRecord = {
  type: {
    fixed: 'page.attendance.clock.scheduleType.fixed',
    flexible: 'page.attendance.clock.scheduleType.flexible',
    shift: 'page.attendance.clock.scheduleType.shift'
  }
} as const satisfies {
  type: Record<Api.Attendance.ScheduleType, I18n.I18nKey>;
};

export const scheduleTypeOptions = transformRecordToOption(scheduleTypeRecord.type);

export const scheduleTypeTagColorRecord: Record<Api.Attendance.ScheduleType, string> = {
  fixed: 'blue',
  flexible: 'gold',
  shift: 'purple'
};

/** 打卡方式 → i18n 键 */
export const clockMethodRecord = {
  method: {
    bluetooth: 'page.attendance.clock.method.bluetooth',
    face: 'page.attendance.clock.method.face',
    gps: 'page.attendance.clock.method.gps',
    wifi: 'page.attendance.clock.method.wifi'
  }
} as const satisfies {
  method: Record<string, I18n.I18nKey>;
};

export const CLOCK_METHOD_KEYS = ['gps', 'wifi', 'face', 'bluetooth'] as const;

export const clockMethodOptions = transformRecordToOption(clockMethodRecord.method);

/** 启用状态标签色 */
export const clockEnabledTagColorRecord: Record<'disabled' | 'enabled', string> = {
  disabled: 'default',
  enabled: 'success'
};

/** 一周工作日（0=周日 … 6=周六） */
export const WEEK_DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];
