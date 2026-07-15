/** Attendance 请假管理迁移期 Mock 数据（来源：hr-pc-manager LeaveManagement 原页面） */

export const MOCK_LEAVE_RECORDS: Api.Attendance.LeaveRecord[] = [
  {
    applicant: '張小明',
    code: 'LV-2026-0045',
    currentNode: '部門主管審批',
    days: 3,
    department: '技術部',
    endDate: '2026-03-12',
    id: 'LV-2026-0045',
    leaveType: 'annual',
    reason: '家庭旅遊',
    startDate: '2026-03-10',
    status: 'pending',
    submitTime: '2026-03-01 09:30'
  },
  {
    applicant: '李文華',
    code: 'LV-2026-0043',
    currentNode: '人事審核',
    days: 1,
    department: '銷售部',
    endDate: '2026-03-05',
    id: 'LV-2026-0043',
    leaveType: 'sick',
    reason: '感冒就醫',
    startDate: '2026-03-05',
    status: 'reviewing',
    submitTime: '2026-02-28 14:20'
  },
  {
    applicant: '王美玲',
    code: 'LV-2026-0040',
    currentNode: '已完成',
    days: 5,
    department: '人事部',
    endDate: '2026-03-20',
    id: 'LV-2026-0040',
    leaveType: 'marriage',
    reason: '結婚',
    startDate: '2026-03-16',
    status: 'approved',
    submitTime: '2026-02-25 08:45'
  },
  {
    applicant: '陳大偉',
    code: 'LV-2026-0038',
    currentNode: '已結束',
    days: 2,
    department: '市場部',
    endDate: '2026-03-04',
    id: 'LV-2026-0038',
    leaveType: 'personal',
    reason: '私人事務',
    startDate: '2026-03-03',
    status: 'rejected',
    submitTime: '2026-02-24 11:30'
  },
  {
    applicant: '林佳蓉',
    code: 'LV-2026-0036',
    currentNode: '已撤回',
    days: 10,
    department: '財務部',
    endDate: '2026-04-10',
    id: 'LV-2026-0036',
    leaveType: 'maternity',
    reason: '生產',
    startDate: '2026-04-01',
    status: 'withdrawn',
    submitTime: '2026-02-20 10:00'
  }
];
