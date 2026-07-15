/** Attendance 请假详情迁移期 Mock 数据（来源：hr-pc-manager LeaveDetail.tsx） */

export const MOCK_LEAVE_DETAILS: Record<string, Api.Attendance.LeaveDetail> = {
  'LV-2026-0045': {
    applicant: '張小明',
    attachments: [],
    code: 'LV-2026-0045',
    days: 3,
    department: '技術部',
    endDate: '2026-03-12',
    leaveType: 'annual',
    position: '前端工程師',
    reason: '計畫與家人一同前往日本旅遊，已提前完成手邊工作交接，期間由同事李文華代理。',
    startDate: '2026-03-10',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '張小明', comment: '計畫家庭旅遊，已安排工作交接', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-05 09:30' },
      { approver: '王大明', id: 2, nodeName: '部門主管審批', role: '技術部主管', status: 'current' },
      { approver: '劉美君', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'pending' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-03-05 09:30'
  },
  'LV-2026-0044': {
    applicant: '李文華',
    attachments: [],
    code: 'LV-2026-0044',
    days: 2,
    department: '銷售部',
    endDate: '2026-03-09',
    leaveType: 'personal',
    position: '業務經理',
    reason: '需要處理個人事務，包括房屋過戶手續辦理。',
    startDate: '2026-03-08',
    status: 'reviewing',
    steps: [
      { action: 'submit', approver: '李文華', comment: '個人事務處理', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-04 14:20' },
      { action: 'approve', approver: '陳經理', comment: '同意，請安排好客戶跟進', id: 2, nodeName: '部門主管審批', role: '銷售部主管', status: 'completed', time: '2026-03-04 16:00' },
      { approver: '劉美君', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'current' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-03-04 14:20'
  },
  'LV-2026-0043': {
    applicant: '王美玲',
    attachments: ['診斷證明書.pdf'],
    code: 'LV-2026-0043',
    days: 1,
    department: '人事部',
    endDate: '2026-03-06',
    leaveType: 'sick',
    position: '人事專員',
    reason: '身體不適需前往醫院就診，已附診斷證明。',
    startDate: '2026-03-06',
    status: 'approved',
    steps: [
      { action: 'submit', approver: '王美玲', comment: '身體不適需就醫', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-05 08:00' },
      { action: 'approve', approver: '趙主管', comment: '注意休息，早日康復', id: 2, nodeName: '部門主管審批', role: '人事部主管', status: 'completed', time: '2026-03-05 08:30' },
      { action: 'autoApprove', approver: '系統自動', comment: '同部門申請，系統自動審核通過', id: 3, nodeName: '人事部審核', role: '同部門免審', status: 'completed', time: '2026-03-05 08:30' },
      { action: 'complete', approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'completed', time: '2026-03-05 08:31' }
    ],
    submitTime: '2026-03-05 08:00'
  },
  'LV-2026-0040': {
    applicant: '黃志偉',
    attachments: [],
    code: 'LV-2026-0040',
    days: 1,
    department: '技術部',
    endDate: '2026-03-03',
    leaveType: 'personal',
    position: '後端工程師',
    reason: '搬家需要一天時間處理。',
    startDate: '2026-03-03',
    status: 'rejected',
    steps: [
      { action: 'submit', approver: '黃志偉', comment: '搬家', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-28 11:00' },
      { action: 'reject', approver: '王大明', comment: '當日有重要版本上線，建議改期，可選擇週末搬家後補休一天', id: 2, nodeName: '部門主管審批', role: '技術部主管', status: 'rejected', time: '2026-02-28 14:00' },
      { approver: '劉美君', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'pending' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-02-28 11:00'
  }
};
