import { matchKeyword, mockPaginate, mockResponse } from '../shared/mock';

import { MOCK_ATTENDANCE_RECORDS } from './mock-data';
import { MOCK_APPROVAL_RECORDS, MOCK_APPROVAL_RULES, MOCK_PENDING_APPROVALS } from './mock-approval';
import { MOCK_APPROVAL_DETAILS } from './mock-approval-detail';
import { MOCK_APPROVAL_RULE_DETAILS } from './mock-approval-rule';
import { MOCK_CLOCK_LOCATIONS, MOCK_CLOCK_RULES, MOCK_CLOCK_SCHEDULES } from './mock-clock';
import { MOCK_LEAVE_RECORDS } from './mock-leave';
import { MOCK_LEAVE_DETAILS } from './mock-leave-detail';
import { MOCK_OVERTIME_RECORDS } from './mock-overtime';

/**
 * Get attendance record list
 *
 * 后端就绪后替换为： return request<Api.Attendance.AttendanceRecordList>({ method: 'get', params, url:
 * ATTENDANCE_URLS.GET_ATTENDANCE_RECORD_LIST });
 */
export function fetchGetAttendanceRecordList(params: Api.Attendance.AttendanceRecordSearchParams) {
  const filtered = MOCK_ATTENDANCE_RECORDS.filter(item => {
    const matchName = matchKeyword(params.name, item.name, item.department);
    const matchDept = !params.department || item.department === params.department;
    const matchStatus = !params.status || item.status === params.status;
    const matchMonth = !params.month || item.date.slice(5, 7) === params.month;
    return matchName && matchDept && matchStatus && matchMonth;
  });

  return mockResponse(mockPaginate(filtered, params));
}

/**
 * Get approval record list
 *
 * 后端就绪后替换为： return request<Api.Attendance.ApprovalRecordList>({ method: 'get', params, url:
 * ATTENDANCE_URLS.GET_APPROVAL_LIST });
 */
export function fetchGetApprovalList(params: Api.Attendance.ApprovalSearchParams) {
  const filtered = MOCK_APPROVAL_RECORDS.filter(item => {
    if (item.status === 'withdrawn') return false;
    const matchKeywordHit = matchKeyword(params.applicant, item.applicant, item.code, item.summary);
    const matchType = !params.type || item.type === params.type;
    const matchStatus = !params.status || item.status === params.status;
    return matchKeywordHit && matchType && matchStatus;
  });

  return mockResponse(mockPaginate(filtered, params));
}

/** Get pending approval list */
export function fetchGetPendingApprovalList(params: Api.Attendance.CommonSearchParams) {
  return mockResponse(mockPaginate(MOCK_PENDING_APPROVALS, params));
}

/**
 * Get approval detail by code
 *
 * 后端就绪后替换为： return request<Api.Attendance.ApprovalDetail>({ method: 'get', params: { code }, url:
 * ATTENDANCE_URLS.GET_APPROVAL_DETAIL });
 */
export function fetchGetApprovalDetail(code: string) {
  return mockResponse<Api.Attendance.ApprovalDetail | null>(MOCK_APPROVAL_DETAILS[code] ?? null);
}

/** Get approval rule list */
export function fetchGetApprovalRuleList(params: Api.Attendance.CommonSearchParams) {
  return mockResponse(mockPaginate(MOCK_APPROVAL_RULES, params));
}

/** Get approval rule detail by id */
export function fetchGetApprovalRuleDetail(id: string) {
  return mockResponse<Api.Attendance.ApprovalRuleDetail | null>(MOCK_APPROVAL_RULE_DETAILS[id] ?? null);
}

/** Get clock location list */
export function fetchGetClockLocationList(params: Api.Attendance.CommonSearchParams) {
  return mockResponse(mockPaginate(MOCK_CLOCK_LOCATIONS, params));
}

/** Get clock schedule list */
export function fetchGetClockScheduleList(params: Api.Attendance.CommonSearchParams) {
  return mockResponse(mockPaginate(MOCK_CLOCK_SCHEDULES, params));
}

/** Get clock rule list */
export function fetchGetClockRuleList(params: Api.Attendance.CommonSearchParams) {
  return mockResponse(mockPaginate(MOCK_CLOCK_RULES, params));
}

/** Get overtime record list */
export function fetchGetOvertimeList(params: Api.Attendance.OvertimeSearchParams) {
  const filtered = MOCK_OVERTIME_RECORDS.filter(item => {
    const matchName = matchKeyword(params.name, item.name, item.department, item.reason);
    const matchDept = !params.department || item.department === params.department;
    const matchStatus = !params.status || item.status === params.status;
    return matchName && matchDept && matchStatus;
  });

  return mockResponse(mockPaginate(filtered, params));
}

/** Get leave detail by id */
export function fetchGetLeaveDetail(id: string) {
  return mockResponse<Api.Attendance.LeaveDetail | null>(MOCK_LEAVE_DETAILS[id] ?? null);
}

/** Get leave record list */
export function fetchGetLeaveList(params: Api.Attendance.LeaveSearchParams) {
  const filtered = MOCK_LEAVE_RECORDS.filter(item => {
    const matchApplicant = matchKeyword(params.applicant, item.applicant, item.code, item.reason);
    const matchType = !params.leaveType || item.leaveType === params.leaveType;
    const matchStatus = !params.status || item.status === params.status;
    return matchApplicant && matchType && matchStatus;
  });

  return mockResponse(mockPaginate(filtered, params));
}
