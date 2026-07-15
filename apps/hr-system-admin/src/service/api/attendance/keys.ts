/** Attendance module query keys */

export const ATTENDANCE_QUERY_KEYS = {
  APPROVAL_DETAIL: (code: string) => ['attendance', 'approvalDetail', code] as const,
  APPROVAL_LIST: (params: Api.Attendance.ApprovalSearchParams) => ['attendance', 'approvalList', params] as const,
  APPROVAL_RULE_DETAIL: (id: string) => ['attendance', 'approvalRuleDetail', id] as const,
  APPROVAL_RULE_LIST: (params: Api.Attendance.CommonSearchParams) =>
    ['attendance', 'approvalRuleList', params] as const,
  ATTENDANCE_RECORD_LIST: (params: Api.Attendance.AttendanceRecordSearchParams) =>
    ['attendance', 'recordList', params] as const,
  CLOCK_LOCATION_LIST: (params: Api.Attendance.CommonSearchParams) =>
    ['attendance', 'clockLocationList', params] as const,
  CLOCK_RULE_LIST: (params: Api.Attendance.CommonSearchParams) => ['attendance', 'clockRuleList', params] as const,
  CLOCK_SCHEDULE_LIST: (params: Api.Attendance.CommonSearchParams) =>
    ['attendance', 'clockScheduleList', params] as const,
  LEAVE_DETAIL: (id: string) => ['attendance', 'leaveDetail', id] as const,
  LEAVE_LIST: (params: Api.Attendance.LeaveSearchParams) => ['attendance', 'leaveList', params] as const,
  OVERTIME_LIST: (params: Api.Attendance.OvertimeSearchParams) => ['attendance', 'overtimeList', params] as const,
  PENDING_APPROVAL_LIST: (params: Api.Attendance.CommonSearchParams) =>
    ['attendance', 'pendingApprovalList', params] as const
} as const;
