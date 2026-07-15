/** Attendance 审批相关迁移期 Mock 数据（来源：hr-pc-manager ApprovalManagement / PendingApprovalTab / ApprovalRulesTab） */

export const MOCK_APPROVAL_RECORDS: Api.Attendance.ApprovalRecord[] = [
  {
    applicant: '張小明',
    attachments: 0,
    code: 'AP-2026-0301',
    currentNode: '部門主管審批',
    department: '技術部',
    id: '1',
    status: 'pending',
    subType: '年假',
    submitTime: '2026-03-01 09:30',
    summary: '年假 3 天 (03/05-03/07)',
    type: 'leave'
  },
  {
    applicant: '李文華',
    attachments: 3,
    code: 'AP-2026-0298',
    currentNode: '財務審核',
    department: '銷售部',
    id: '2',
    status: 'pending',
    subType: '差旅費',
    submitTime: '2026-02-28 14:20',
    summary: '出差報銷 NT$12,500',
    type: 'expense'
  },
  {
    applicant: '王美玲',
    attachments: 0,
    code: 'AP-2026-0295',
    currentNode: '已完成',
    department: '人事部',
    id: '3',
    status: 'approved',
    submitTime: '2026-02-27 17:00',
    summary: '加班 4 小時 (02/28)',
    type: 'overtime'
  },
  {
    applicant: '陳大偉',
    attachments: 2,
    code: 'AP-2026-0290',
    currentNode: '已完成',
    department: '市場部',
    id: '4',
    status: 'approved',
    submitTime: '2026-02-26 10:15',
    summary: '上海出差 3 天 (03/10-03/12)',
    type: 'travel'
  },
  {
    applicant: '林佳蓉',
    attachments: 1,
    code: 'AP-2026-0288',
    currentNode: '已結束',
    department: '財務部',
    id: '5',
    status: 'rejected',
    subType: '病假',
    submitTime: '2026-02-25 08:45',
    summary: '病假 1 天 (02/25)',
    type: 'leave'
  }
];

export const MOCK_PENDING_APPROVALS: Api.Attendance.PendingApproval[] = [
  {
    applicant: '張小明',
    code: 'AP-2026-0301',
    currentNode: '部門主管審批',
    department: '技術部',
    id: '1',
    subType: '年假',
    submitTime: '2026-03-01 09:30',
    summary: '年假 3 天 (03/05-03/07)',
    type: 'leave',
    urgency: 'normal',
    waitingHours: 6
  },
  {
    applicant: '李文華',
    code: 'AP-2026-0298',
    currentNode: '財務審核',
    department: '銷售部',
    id: '2',
    subType: '差旅費',
    submitTime: '2026-02-28 14:20',
    summary: '出差報銷 NT$12,500',
    type: 'expense',
    urgency: 'urgent',
    waitingHours: 26
  },
  {
    applicant: '趙志強',
    code: 'AP-2026-0310',
    currentNode: '部門主管審批',
    department: '技術部',
    id: '7',
    submitTime: '2026-03-02 18:00',
    summary: '加班 3 小時 (03/02)',
    type: 'overtime',
    urgency: 'normal',
    waitingHours: 2
  },
  {
    applicant: '周雅婷',
    code: 'AP-2026-0312',
    currentNode: '總經理審批',
    department: '市場部',
    id: '8',
    submitTime: '2026-02-25 09:00',
    summary: '北京出差 5 天 (03/15-03/19)',
    type: 'travel',
    urgency: 'overdue',
    waitingHours: 72
  },
  {
    applicant: '吳建國',
    code: 'AP-2026-0315',
    currentNode: '部門主管審批',
    department: '人事部',
    id: '9',
    subType: '事假',
    submitTime: '2026-03-03 08:00',
    summary: '事假 1 天 (03/04)',
    type: 'leave',
    urgency: 'urgent',
    waitingHours: 18
  }
];

export const MOCK_APPROVAL_RULES: Api.Attendance.ApprovalRule[] = [
  {
    applyScope: '全公司',
    conditions: '請假天數 ≤ 3 天：部門主管 → 人事；> 3 天：加總經理',
    creator: '系統管理員',
    enabled: true,
    id: '1',
    levels: 3,
    name: '請假審批流程',
    type: 'leave',
    updatedAt: '2026-02-20'
  },
  {
    applyScope: '全公司',
    conditions: '金額 ≤ 5,000：主管；≤ 30,000：加財務；> 30,000：加總經理',
    creator: '系統管理員',
    enabled: true,
    id: '2',
    levels: 4,
    name: '報銷審批流程',
    type: 'expense',
    updatedAt: '2026-02-18'
  },
  {
    applyScope: '全公司',
    conditions: '部門主管 → 人事備案',
    creator: '系統管理員',
    enabled: true,
    id: '3',
    levels: 2,
    name: '加班審批流程',
    type: 'overtime',
    updatedAt: '2026-02-15'
  },
  {
    applyScope: '技術部',
    conditions: '部門主管 → 技術總監（跳過人事）',
    creator: '王大明',
    enabled: false,
    id: '5',
    levels: 2,
    name: '技術部專屬請假流程',
    type: 'leave',
    updatedAt: '2026-01-25'
  },
  {
    applyScope: '全公司',
    conditions: '部門主管 → 人事 → 總經理；試用期內：主管 → 人事',
    creator: '系統管理員',
    enabled: true,
    id: '7',
    levels: 4,
    name: '離職審批流程',
    type: 'resignation',
    updatedAt: '2026-03-01'
  }
];
