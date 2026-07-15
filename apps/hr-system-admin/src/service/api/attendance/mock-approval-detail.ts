/** Attendance 审批详情迁移期 Mock 数据（来源：hr-pc-manager ApprovalDetail/constants.ts） */

export const MOCK_APPROVAL_DETAILS: Record<string, Api.Attendance.ApprovalDetail> = {
  'AP-2026-0290': {
    applicant: '陳大偉',
    attachments: ['出差行程表.pdf', '客戶會議邀請函.pdf'],
    code: 'AP-2026-0290',
    department: '市場部',
    details: {
      出差事由: '參加上海客戶年度合作會議，洽談下半年合作方案。',
      出差天數: '3 天',
      出差目的地: '上海',
      結束日期: '2026-03-12',
      起始日期: '2026-03-10',
      預估費用: 'NT$ 25,000'
    },
    position: '市場經理',
    status: 'approved',
    steps: [
      { action: 'submit', approver: '陳大偉', comment: '上海客戶會議出差', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-26 10:15' },
      { action: 'approve', approver: '吳總監', comment: '重要客戶會議，同意出差', id: 2, nodeName: '部門主管審批', role: '市場部總監', status: 'completed', time: '2026-02-26 14:00' },
      { action: 'approve', approver: '劉美君', comment: '已確認出差保險', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'completed', time: '2026-02-26 16:00' },
      { action: 'complete', approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'completed', time: '2026-02-26 16:01' }
    ],
    submitTime: '2026-02-26 10:15',
    summary: '上海出差 3 天 (03/10-03/12)',
    type: 'travel'
  },
  'AP-2026-0295': {
    applicant: '王美玲',
    attachments: [],
    code: 'AP-2026-0295',
    department: '人事部',
    details: {
      加班事由: '月底薪資結算作業，需配合完成全公司薪資計算及核對。',
      加班日期: '2026-02-28',
      加班時段: '18:00 ~ 22:00',
      加班時數: '4 小時',
      加班類型: '平日加班'
    },
    position: '人事專員',
    status: 'approved',
    steps: [
      { action: 'submit', approver: '王美玲', comment: '月底薪資結算加班', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-27 17:00' },
      { action: 'approve', approver: '趙主管', comment: '同意加班', id: 2, nodeName: '部門主管審批', role: '人事部主管', status: 'completed', time: '2026-02-27 17:30' },
      { action: 'autoApprove', approver: '系統自動', comment: '同部門申請，系統自動審核通過', id: 3, nodeName: '人事部審核', role: '同部門免審', status: 'completed', time: '2026-02-27 17:30' },
      { action: 'complete', approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'completed', time: '2026-02-27 17:31' }
    ],
    submitTime: '2026-02-27 17:00',
    summary: '加班 4 小時 (02/28)',
    type: 'overtime'
  },
  'AP-2026-0298': {
    applicant: '李文華',
    attachments: ['發票_001.pdf', '住宿收據.pdf', '交通費明細.xlsx'],
    code: 'AP-2026-0298',
    department: '銷售部',
    details: {
      發生日期: '2026-02-20 ~ 2026-02-22',
      報銷事由: '上海客戶拜訪出差，包含住宿費、交通費及餐費。已附相關發票及收據。',
      報銷金額: 'NT$ 12,500',
      報銷類別: '差旅費'
    },
    position: '業務經理',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '李文華', comment: '出差報銷申請', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-28 14:20' },
      { action: 'approve', approver: '陳經理', comment: '費用合理，同意報銷', id: 2, nodeName: '部門主管審批', role: '銷售部主管', status: 'completed', time: '2026-02-28 16:30' },
      { approver: '林會計', id: 3, nodeName: '財務審核', role: '財務專員', status: 'current' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-02-28 14:20',
    summary: '出差報銷 NT$12,500',
    subType: '差旅費',
    type: 'expense'
  },
  'AP-2026-0301': {
    applicant: '張小明',
    attachments: [],
    code: 'AP-2026-0301',
    department: '技術部',
    details: {
      假別: '年假',
      請假天數: '3 天',
      請假事由: '計畫與家人一同前往日本旅遊，已提前完成手邊工作交接，期間由同事李文華代理。',
      結束日期: '2026-03-07',
      起始日期: '2026-03-05'
    },
    position: '前端工程師',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '張小明', comment: '申請年假出遊', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-01 09:30' },
      { approver: '王大明', id: 2, nodeName: '部門主管審批', role: '技術部主管', status: 'current' },
      { approver: '劉美君', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'pending' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-03-01 09:30',
    summary: '年假 3 天 (03/05-03/07)',
    subType: '年假',
    type: 'leave'
  },
  'AP-2026-0288': {
    applicant: '林佳蓉',
    attachments: ['診斷證明書.pdf'],
    code: 'AP-2026-0288',
    department: '財務部',
    details: {
      假別: '病假',
      請假天數: '1 天',
      請假事由: '身體不適需前往醫院就診。',
      結束日期: '2026-02-25',
      起始日期: '2026-02-25'
    },
    position: '會計師',
    status: 'rejected',
    steps: [
      { action: 'submit', approver: '林佳蓉', comment: '身體不適需就醫', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-25 08:45' },
      { action: 'reject', approver: '財務主管', comment: '當日為月結日，請改期或提供更詳細的診斷證明', id: 2, nodeName: '部門主管審批', role: '財務部主管', status: 'rejected', time: '2026-02-25 09:30' },
      { approver: '劉美君', id: 3, nodeName: '人事部審核', role: '人事專員', status: 'pending' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-02-25 08:45',
    summary: '病假 1 天 (02/25)',
    subType: '病假',
    type: 'leave'
  },
  'AP-2026-0285': {
    applicant: '黃志偉',
    attachments: ['交通費收據.pdf'],
    code: 'AP-2026-0285',
    department: '技術部',
    details: {
      發生日期: '2026-02-20',
      報銷事由: '客戶現場支援交通費用。',
      報銷金額: 'NT$ 2,300',
      報銷類別: '交通費'
    },
    position: '後端工程師',
    status: 'withdrawn',
    steps: [
      { action: 'submit', approver: '黃志偉', comment: '交通費報銷', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-24 11:30' },
      { action: 'withdraw', approver: '黃志偉', comment: '金額有誤，需重新提交', id: 2, nodeName: '已撤回', role: '申請人', status: 'completed', time: '2026-02-24 15:00' }
    ],
    submitTime: '2026-02-24 11:30',
    summary: '交通費報銷 NT$2,300',
    subType: '交通費',
    type: 'expense'
  },
  'AP-2026-0310': {
    applicant: '趙志強',
    attachments: [],
    code: 'AP-2026-0310',
    department: '技術部',
    details: {
      加班事由: '趕專案上線，需進行最終測試與部署。',
      加班日期: '2026-03-02',
      加班時段: '19:00 ~ 22:00',
      加班時數: '3 小時',
      加班類型: '平日加班'
    },
    position: '後端工程師',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '趙志強', comment: '趕專案上線加班', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-02 18:00' },
      { approver: '王大明', id: 2, nodeName: '部門主管審批', role: '技術部主管', status: 'current' },
      { approver: '劉美君', id: 3, nodeName: '人事部備案', role: '人事專員', status: 'pending' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-03-02 18:00',
    summary: '加班 3 小時 (03/02)',
    type: 'overtime'
  },
  'AP-2026-0312': {
    applicant: '周雅婷',
    attachments: ['出差計畫書.pdf'],
    code: 'AP-2026-0312',
    department: '市場部',
    details: {
      出差事由: '參加行業峰會暨客戶拓展活動。',
      出差天數: '5 天',
      出差目的地: '北京',
      結束日期: '2026-03-19',
      起始日期: '2026-03-15',
      預估費用: 'NT$ 45,000'
    },
    position: '市場專員',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '周雅婷', comment: '北京行業峰會出差', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-02-25 09:00' },
      { action: 'approve', approver: '吳總監', comment: '同意出差', id: 2, nodeName: '部門主管審批', role: '市場部總監', status: 'completed', time: '2026-02-25 14:00' },
      { approver: '總經理', id: 3, nodeName: '總經理審批', role: '總經理', status: 'current' },
      { approver: '系統', id: 4, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-02-25 09:00',
    summary: '北京出差 5 天 (03/15-03/19)',
    type: 'travel'
  },
  'AP-2026-0315': {
    applicant: '吳建國',
    attachments: [],
    code: 'AP-2026-0315',
    department: '人事部',
    details: {
      假別: '事假',
      請假天數: '1 天',
      請假事由: '家中有事需處理。',
      結束日期: '2026-03-04',
      起始日期: '2026-03-04'
    },
    position: '人事主管',
    status: 'pending',
    steps: [
      { action: 'submit', approver: '吳建國', comment: '家中有事', id: 1, nodeName: '提交申請', role: '申請人', status: 'completed', time: '2026-03-03 08:00' },
      { approver: '趙主管', id: 2, nodeName: '部門主管審批', role: '人事部主管', status: 'current' },
      { approver: '系統', id: 3, nodeName: '審批完成', role: '', status: 'pending' }
    ],
    submitTime: '2026-03-03 08:00',
    summary: '事假 1 天 (03/04)',
    subType: '事假',
    type: 'leave'
  }
};
