import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import {
  fetchGetApprovalDetail,
  fetchGetApprovalList,
  fetchGetApprovalRuleDetail,
  fetchGetApprovalRuleList,
  fetchGetAttendanceRecordList,
  fetchGetClockLocationList,
  fetchGetClockRuleList,
  fetchGetClockScheduleList,
  fetchGetLeaveDetail,
  fetchGetLeaveList,
  fetchGetOvertimeList,
  fetchGetPendingApprovalList
} from './api';
import { ATTENDANCE_QUERY_KEYS } from './keys';

type ServiceQueryOptions<Response, Data = Response> = Omit<
  UseQueryOptions<Response, Error, Data, QueryKey>,
  'queryFn' | 'queryKey'
>;

/**
 * Get attendance record list query hook
 *
 * @param params - Search parameters
 */
export function useAttendanceRecordListQuery<Data = Api.Attendance.AttendanceRecordList>(
  params: Api.Attendance.AttendanceRecordSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.AttendanceRecordList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetAttendanceRecordList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.ATTENDANCE_RECORD_LIST(params)
  });
}

/**
 * Get approval record list query hook
 *
 * @param params - Search parameters
 */
export function useApprovalListQuery<Data = Api.Attendance.ApprovalRecordList>(
  params: Api.Attendance.ApprovalSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.ApprovalRecordList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetApprovalList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.APPROVAL_LIST(params)
  });
}

/**
 * Get approval detail query hook
 *
 * @param code - Approval code
 */
export function useApprovalDetailQuery<Data = Api.Attendance.ApprovalDetail | null>(
  code: string,
  options?: ServiceQueryOptions<Api.Attendance.ApprovalDetail | null, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetApprovalDetail(code),
    queryKey: ATTENDANCE_QUERY_KEYS.APPROVAL_DETAIL(code)
  });
}

/**
 * Get pending approval list query hook
 *
 * @param params - Search parameters
 */
export function usePendingApprovalListQuery<Data = Api.Attendance.PendingApprovalList>(
  params: Api.Attendance.CommonSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.PendingApprovalList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetPendingApprovalList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.PENDING_APPROVAL_LIST(params)
  });
}

/**
 * Get approval rule detail query hook
 *
 * @param id - Rule id
 */
export function useApprovalRuleDetailQuery<Data = Api.Attendance.ApprovalRuleDetail | null>(
  id: string,
  options?: ServiceQueryOptions<Api.Attendance.ApprovalRuleDetail | null, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetApprovalRuleDetail(id),
    queryKey: ATTENDANCE_QUERY_KEYS.APPROVAL_RULE_DETAIL(id)
  });
}

/**
 * Get approval rule list query hook
 *
 * @param params - Search parameters
 */
export function useApprovalRuleListQuery<Data = Api.Attendance.ApprovalRuleList>(
  params: Api.Attendance.CommonSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.ApprovalRuleList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetApprovalRuleList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.APPROVAL_RULE_LIST(params)
  });
}

/** Get clock location list query hook */
export function useClockLocationListQuery<Data = Api.Attendance.ClockLocationList>(
  params: Api.Attendance.CommonSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.ClockLocationList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetClockLocationList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.CLOCK_LOCATION_LIST(params)
  });
}

/** Get clock schedule list query hook */
export function useClockScheduleListQuery<Data = Api.Attendance.ClockScheduleList>(
  params: Api.Attendance.CommonSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.ClockScheduleList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetClockScheduleList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.CLOCK_SCHEDULE_LIST(params)
  });
}

/** Get clock rule list query hook */
export function useClockRuleListQuery<Data = Api.Attendance.ClockRuleList>(
  params: Api.Attendance.CommonSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.ClockRuleList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetClockRuleList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.CLOCK_RULE_LIST(params)
  });
}

/** Get overtime record list query hook */
export function useOvertimeListQuery<Data = Api.Attendance.OvertimeRecordList>(
  params: Api.Attendance.OvertimeSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.OvertimeRecordList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetOvertimeList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.OVERTIME_LIST(params)
  });
}

/** Get leave detail query hook */
export function useLeaveDetailQuery<Data = Api.Attendance.LeaveDetail | null>(
  id: string,
  options?: ServiceQueryOptions<Api.Attendance.LeaveDetail | null, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetLeaveDetail(id),
    queryKey: ATTENDANCE_QUERY_KEYS.LEAVE_DETAIL(id)
  });
}

/** Get leave record list query hook */
export function useLeaveListQuery<Data = Api.Attendance.LeaveRecordList>(
  params: Api.Attendance.LeaveSearchParams,
  options?: ServiceQueryOptions<Api.Attendance.LeaveRecordList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetLeaveList(params),
    queryKey: ATTENDANCE_QUERY_KEYS.LEAVE_LIST(params)
  });
}
