import { transformRecordToOption } from '@/utils/common';

/** 审批人类型 → i18n 键 */
export const approverTypeRecord = {
  type: {
    departmentHead: 'page.attendance.approval.approverType.departmentHead',
    directManager: 'page.attendance.approval.approverType.directManager',
    person: 'page.attendance.approval.approverType.person',
    role: 'page.attendance.approval.approverType.role'
  }
} as const satisfies {
  type: Record<Api.Attendance.ApproverType, I18n.I18nKey>;
};

export const approverTypeOptions = transformRecordToOption(approverTypeRecord.type);

/** 超时处理 → i18n 键 */
export const overtimeHandlingRecord = {
  action: {
    autoApprove: 'page.attendance.approval.overtimeHandling.autoApprove',
    autoReject: 'page.attendance.approval.overtimeHandling.autoReject',
    autoTransfer: 'page.attendance.approval.overtimeHandling.autoTransfer',
    remind: 'page.attendance.approval.overtimeHandling.remind',
    remindEscalate: 'page.attendance.approval.overtimeHandling.remindEscalate'
  }
} as const satisfies {
  action: Record<Api.Attendance.OvertimeHandling, I18n.I18nKey>;
};

export const overtimeHandlingOptions = transformRecordToOption(overtimeHandlingRecord.action);

/** 适用范围（组织数据） */
export const SCOPE_OPTIONS = ['全公司', '技術部', '銷售部', '市場部', '財務部', '人事部'].map(value => ({
  label: value,
  value
}));

/** 条件运算符 */
export const OPERATORS = ['=', '≠', '>', '≥', '<', '≤'].map(value => ({ label: value, value }));

/** 各申请类型可用的条件字段 */
export const CONDITION_FIELDS: Record<Api.Attendance.ApprovalType, string[]> = {
  expense: ['報銷金額', '報銷類別'],
  leave: ['請假天數', '假別'],
  overtime: ['加班時數', '加班類型'],
  resignation: ['在職天數', '員工類型', '離職原因'],
  travel: ['出差天數', '目的地類型']
};
