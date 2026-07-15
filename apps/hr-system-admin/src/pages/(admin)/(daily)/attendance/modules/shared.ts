import { z } from 'zod';

import { transformRecordToOption } from '@/utils/common';

const approvalNullableStringSearchSchema = z
  .string()
  .nullish()
  .catch(null)
  .transform(value => value || null);

const approvalStatusSearchSchema = z
  .enum(['pending', 'approved', 'rejected', 'withdrawn', 'draft'])
  .nullish()
  .catch(null)
  .transform(value => value ?? null);

const approvalTypeSearchSchema = z
  .enum(['leave', 'expense', 'overtime', 'travel', 'resignation'])
  .nullish()
  .catch(null)
  .transform(value => value ?? null);

export const ApprovalSearchSchema = z.object({
  applicant: approvalNullableStringSearchSchema,
  current: z.coerce.number().positive().catch(1).default(1),
  size: z.coerce.number().positive().catch(10).default(10),
  status: approvalStatusSearchSchema,
  type: approvalTypeSearchSchema
});

export const approvalStatusRecord = {
  status: {
    approved: 'page.attendance.approval.status.approved',
    draft: 'page.attendance.approval.status.draft',
    pending: 'page.attendance.approval.status.pending',
    rejected: 'page.attendance.approval.status.rejected',
    withdrawn: 'page.attendance.approval.status.withdrawn'
  }
} as const satisfies {
  status: Record<Api.Attendance.ApprovalStatus, I18n.I18nKey>;
};

export const approvalStatusOptions = transformRecordToOption(approvalStatusRecord.status);

export const approvalTypeRecord = {
  type: {
    expense: 'page.attendance.approval.type.expense',
    leave: 'page.attendance.approval.type.leave',
    overtime: 'page.attendance.approval.type.overtime',
    resignation: 'page.attendance.approval.type.resignation',
    travel: 'page.attendance.approval.type.travel'
  }
} as const satisfies {
  type: Record<Api.Attendance.ApprovalType, I18n.I18nKey>;
};

export const approvalTypeOptions = transformRecordToOption(approvalTypeRecord.type);

export const approvalTypeTagColorRecord: Record<Api.Attendance.ApprovalType, string> = {
  expense: 'warning',
  leave: 'processing',
  overtime: 'cyan',
  resignation: 'error',
  travel: 'success'
};

export const approvalStatusTagColorRecord: Record<Api.Attendance.ApprovalStatus, string> = {
  approved: 'success',
  draft: 'default',
  pending: 'warning',
  rejected: 'error',
  withdrawn: 'default'
};

export const attendanceStatusRecord = {
  status: {
    absent: 'page.attendance.record.status.absent',
    early: 'page.attendance.record.status.early',
    late: 'page.attendance.record.status.late',
    leave: 'page.attendance.record.status.leave',
    normal: 'page.attendance.record.status.normal',
    rest: 'page.attendance.record.status.rest'
  }
} as const satisfies {
  status: Record<Api.Attendance.AttendanceStatus, I18n.I18nKey>;
};

export const attendanceStatusOptions = transformRecordToOption(attendanceStatusRecord.status);

export const attendanceStatusTagColorRecord: Record<Api.Attendance.AttendanceStatus, string> = {
  absent: 'error',
  early: 'orange',
  late: 'warning',
  leave: 'processing',
  normal: 'success',
  rest: 'default'
};

export const overtimeStatusRecord = {
  status: {
    approved: 'page.attendance.overtime.status.approved',
    pending: 'page.attendance.overtime.status.pending',
    rejected: 'page.attendance.overtime.status.rejected'
  }
} as const satisfies {
  status: Record<Api.Attendance.OvertimeStatus, I18n.I18nKey>;
};

export const overtimeStatusOptions = transformRecordToOption(overtimeStatusRecord.status);

export const overtimeStatusTagColorRecord: Record<Api.Attendance.OvertimeStatus, string> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error'
};

export const leaveStatusRecord = {
  status: {
    approved: 'page.attendance.leave.status.approved',
    draft: 'page.attendance.leave.status.draft',
    pending: 'page.attendance.leave.status.pending',
    rejected: 'page.attendance.leave.status.rejected',
    reviewing: 'page.attendance.leave.status.reviewing',
    withdrawn: 'page.attendance.leave.status.withdrawn'
  }
} as const satisfies {
  status: Record<Api.Attendance.LeaveStatus, I18n.I18nKey>;
};

export const leaveStatusOptions = transformRecordToOption(leaveStatusRecord.status);

export const leaveStatusTagColorRecord: Record<Api.Attendance.LeaveStatus, string> = {
  approved: 'success',
  draft: 'default',
  pending: 'warning',
  rejected: 'error',
  reviewing: 'processing',
  withdrawn: 'default'
};

export const leaveTypeRecord = {
  type: {
    annual: 'page.attendance.leave.type.annual',
    bereavement: 'page.attendance.leave.type.bereavement',
    compensatory: 'page.attendance.leave.type.compensatory',
    marriage: 'page.attendance.leave.type.marriage',
    maternity: 'page.attendance.leave.type.maternity',
    official: 'page.attendance.leave.type.official',
    paternity: 'page.attendance.leave.type.paternity',
    personal: 'page.attendance.leave.type.personal',
    sick: 'page.attendance.leave.type.sick'
  }
} as const satisfies {
  type: Record<Api.Attendance.LeaveType, I18n.I18nKey>;
};

export const leaveTypeOptions = transformRecordToOption(leaveTypeRecord.type);

export const leaveTypeTagColorRecord: Record<Api.Attendance.LeaveType, string> = {
  annual: 'processing',
  bereavement: 'default',
  compensatory: 'cyan',
  marriage: 'magenta',
  maternity: 'purple',
  official: 'geekblue',
  paternity: 'purple',
  personal: 'gold',
  sick: 'warning'
};

export function getApprovalSearchInitialParams(): Api.Attendance.ApprovalSearchParams {
  return {
    applicant: null,
    current: 1,
    size: 10,
    status: null,
    type: null
  };
}

export function normalizeApprovalSearchSchema(
  params: Partial<Api.Attendance.ApprovalSearchParams>
): Api.Attendance.ApprovalSearchParams {
  return ApprovalSearchSchema.parse(params);
}
