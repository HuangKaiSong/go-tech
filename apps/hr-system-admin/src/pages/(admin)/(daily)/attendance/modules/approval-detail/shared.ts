/** 审批详情页共享常量（严格对应 hr-pc-manager ApprovalDetail 的交互逻辑） */

/** 审批操作类型（UI 本地） */
export type ActionType = 'approve' | 'reject' | 'returnModify' | 'transfer' | 'withdraw' | null;

/** 审批节点动作 → i18n 键 */
export const stepActionRecord = {
  action: {
    approve: 'page.attendance.approval.action.approve',
    autoApprove: 'page.attendance.approval.action.autoApprove',
    complete: 'page.attendance.approval.action.complete',
    reject: 'page.attendance.approval.action.reject',
    returnModify: 'page.attendance.approval.action.returnModify',
    submit: 'page.attendance.approval.action.submit',
    transfer: 'page.attendance.approval.action.transfer',
    withdraw: 'page.attendance.approval.action.withdraw'
  }
} as const satisfies {
  action: Record<Api.Attendance.ApprovalStepAction, I18n.I18nKey>;
};

/** 节点动作标签色 */
export const stepActionTagColorRecord: Record<Api.Attendance.ApprovalStepAction, string> = {
  approve: 'success',
  autoApprove: 'success',
  complete: 'success',
  reject: 'error',
  returnModify: 'warning',
  submit: 'default',
  transfer: 'processing',
  withdraw: 'default'
};

/** 节点状态颜色（进度条 / 时间线圆点） */
export const stepStatusColorRecord: Record<Api.Attendance.ApprovalStepStatus, string> = {
  completed: '#52c41a',
  current: '#faad14',
  pending: '#d9d9d9',
  rejected: '#ff4d4f'
};

/** 节点状态图标（iconify） */
export const stepStatusIconRecord: Record<Api.Attendance.ApprovalStepStatus, string> = {
  completed: 'lucide:check-circle-2',
  current: 'lucide:clock',
  pending: 'lucide:file-text',
  rejected: 'lucide:x-circle'
};

/** 转签对象（Mock） */
export const TRANSFER_TARGETS = [
  { label: '趙總監 · 技術總監', value: '趙總監' },
  { label: '劉美君 · 人事專員', value: '劉美君' },
  { label: '林會計 · 財務專員', value: '林會計' },
  { label: '陳經理 · 銷售部主管', value: '陳經理' },
  { label: '吳總監 · 市場部總監', value: '吳總監' }
];

/** 明细字段：数值型（加粗高亮） */
export const BOLD_KEYWORDS = ['天數', '時數', '金額', '費用'];

/** 明细字段：分类型（Tag 展示） */
export const BADGE_KEYWORDS = ['類別', '假別', '類型'];

export function matchesAny(key: string, list: string[]) {
  return list.some(item => key.includes(item));
}
