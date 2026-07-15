/** Attendance 审批规则详情迁移期 Mock 数据（来源：hr-pc-manager ApprovalRuleDetail.tsx） */

export const MOCK_APPROVAL_RULE_DETAILS: Record<string, Api.Attendance.ApprovalRuleDetail> = {
  '1': {
    applyScope: '全公司',
    conditions: [
      { action: '跳過第 3 級（總經理）', label: '請假天數', operator: '≤', value: '3 天' },
      { action: '完整三級審批', label: '請假天數', operator: '>', value: '3 天' },
      { action: '需上傳診斷證明', label: '假別', operator: '=', value: '病假' }
    ],
    createdAt: '2026-01-01',
    creator: '系統管理員',
    description: '適用於全公司員工的請假審批流程，根據請假天數自動匹配不同的審批層級。',
    enabled: true,
    id: '1',
    levels: [
      { approver: '自動匹配', approverType: 'directManager', level: 1, name: '部門主管審批' },
      { approver: '人事專員', approverType: 'role', level: 2, name: '人事部審核' },
      { approver: '陳總經理', approverType: 'person', condition: '請假天數 > 3 天時觸發', level: 3, name: '總經理審批' }
    ],
    name: '請假審批流程',
    settings: {
      allowWithdraw: true,
      autoApprove: false,
      autoApproveCondition: '',
      notifyApplicant: true,
      notifyNextApprover: true,
      overtimeAction: 'remind',
      timeLimit: 48
    },
    type: 'leave',
    updatedAt: '2026-02-20'
  },
  '2': {
    applyScope: '全公司',
    conditions: [
      { action: '僅需主管 + 財務審核', label: '報銷金額', operator: '≤', value: 'NT$ 5,000' },
      { action: '加財務經理審批', label: '報銷金額', operator: '>', value: 'NT$ 5,000' },
      { action: '加總經理審批', label: '報銷金額', operator: '>', value: 'NT$ 30,000' }
    ],
    createdAt: '2026-01-01',
    creator: '系統管理員',
    description: '根據報銷金額自動匹配審批層級，確保大額報銷經過充分審核。',
    enabled: true,
    id: '2',
    levels: [
      { approver: '自動匹配', approverType: 'directManager', level: 1, name: '部門主管審批' },
      { approver: '財務專員', approverType: 'role', level: 2, name: '財務審核' },
      { approver: '財務經理', approverType: 'role', condition: '金額 > 5,000', level: 3, name: '財務經理審批' },
      { approver: '陳總經理', approverType: 'person', condition: '金額 > 30,000', level: 4, name: '總經理審批' }
    ],
    name: '報銷審批流程',
    settings: {
      allowWithdraw: true,
      autoApprove: false,
      autoApproveCondition: '',
      notifyApplicant: true,
      notifyNextApprover: true,
      overtimeAction: 'remind',
      timeLimit: 72
    },
    type: 'expense',
    updatedAt: '2026-02-18'
  },
  '7': {
    applyScope: '全公司',
    conditions: [
      { action: '僅需主管 + 人事審核（跳過第 3、4 級）', label: '員工類型', operator: '=', value: '試用期' },
      { action: '需人事經理確認', label: '員工類型', operator: '=', value: '正式員工' },
      { action: '加總經理審批', label: '在職天數', operator: '>', value: '365 天' },
      { action: '直接由人事 + 總經理審批', label: '離職原因', operator: '=', value: '辭退' }
    ],
    createdAt: '2026-02-15',
    creator: '系統管理員',
    description: '適用於全公司員工的離職審批流程，根據員工在職天數及類型自動匹配審批層級，確保離職交接有序進行。',
    enabled: true,
    id: '7',
    levels: [
      { approver: '自動匹配', approverType: 'directManager', level: 1, name: '部門主管審批' },
      { approver: '人事專員', approverType: 'role', level: 2, name: '人事部審核' },
      { approver: '人事經理', approverType: 'role', condition: '正式員工觸發', level: 3, name: '人事經理確認' },
      {
        approver: '陳總經理',
        approverType: 'person',
        condition: '在職超過 1 年或主管級以上',
        level: 4,
        name: '總經理審批'
      }
    ],
    name: '離職審批流程',
    settings: {
      allowWithdraw: true,
      autoApprove: false,
      autoApproveCondition: '',
      notifyApplicant: true,
      notifyNextApprover: true,
      overtimeAction: 'remindEscalate',
      timeLimit: 72
    },
    type: 'resignation',
    updatedAt: '2026-03-01'
  }
};
