import { CalendarDays, CheckCircle2, Clock, DollarSign, FileText, MapPin, RotateCcw, XCircle } from 'lucide-react';
import type { ApprovalData, ApprovalStatus, StepStatus } from './types';

export const statusConfig: Record<ApprovalStatus, { color: string; icon: React.ElementType; label: string }> = {
  草稿: { color: 'bg-muted text-muted-foreground', icon: FileText, label: '草稿' },
  待審: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: '待審核' },
  通過: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, label: '已通過' },
  駁回: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle, label: '已駁回' },
  撤回: { color: 'bg-muted text-muted-foreground', icon: RotateCcw, label: '已撤回' }
};

export const stepStatusStyle: Record<StepStatus, string> = {
  completed: 'border-success bg-success text-success-foreground',
  current: 'border-warning bg-warning text-warning-foreground animate-pulse',
  pending: 'border-border bg-muted text-muted-foreground',
  rejected: 'border-destructive bg-destructive text-destructive-foreground'
};

export const stepLineStyle: Record<StepStatus, string> = {
  completed: 'bg-success',
  current: 'bg-warning',
  pending: 'bg-border',
  rejected: 'bg-destructive'
};

export const typeIcons: Record<string, React.ElementType> = {
  請假申請: CalendarDays,
  加班申請: Clock,
  報銷申請: DollarSign,
  出差申請: MapPin
};

export const actionBadgeStyles: Record<string, string> = {
  通過: 'bg-success/10 text-success border-success/20',
  自動通過: 'bg-success/10 text-success border-success/20',
  完成: 'bg-success/10 text-success border-success/20',
  駁回: 'bg-destructive/10 text-destructive border-destructive/20',
  撤回: 'bg-muted text-muted-foreground',
  轉簽: 'bg-primary/10 text-primary border-primary/20',
  退回修改: 'bg-warning/10 text-warning border-warning/20'
};

export const progressBarColor: Record<string, string> = {
  駁回: 'bg-destructive',
  撤回: 'bg-muted-foreground'
};

export const stepIndicatorStyle: Record<StepStatus, string> = {
  completed: 'border-success bg-success text-success-foreground',
  current: 'border-warning bg-warning text-warning-foreground',
  rejected: 'border-destructive bg-destructive text-destructive-foreground',
  pending: 'border-border bg-muted text-muted-foreground'
};

export const mockApprovalData: Record<string, ApprovalData> = {
  'AP-2026-0301': {
    code: 'AP-2026-0301',
    applicant: '張小明',
    department: '技術部',
    position: '前端工程師',
    type: '請假申請',
    subType: '年假',
    summary: '年假 3 天 (03/05-03/07)',
    status: '待審',
    submitTime: '2026-03-01 09:30',
    attachments: [],
    details: {
      假別: '年假',
      起始日期: '2026-03-05',
      結束日期: '2026-03-07',
      請假天數: '3 天',
      請假事由: '計畫與家人一同前往日本旅遊，已提前完成手邊工作交接，期間由同事李文華代理。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '張小明',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-01 09:30',
        comment: '申請年假出遊'
      },
      { id: 2, nodeName: '部門主管審批', approver: '王大明', role: '技術部主管', status: 'current' },
      { id: 3, nodeName: '人事部審核', approver: '劉美君', role: '人事專員', status: 'pending' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'AP-2026-0298': {
    code: 'AP-2026-0298',
    applicant: '李文華',
    department: '銷售部',
    position: '業務經理',
    type: '報銷申請',
    subType: '差旅費',
    summary: '出差報銷 NT$12,500',
    status: '待審',
    submitTime: '2026-02-28 14:20',
    attachments: ['發票_001.pdf', '住宿收據.pdf', '交通費明細.xlsx'],
    details: {
      報銷類別: '差旅費',
      報銷金額: 'NT$ 12,500',
      發生日期: '2026-02-20 ~ 2026-02-22',
      報銷事由: '上海客戶拜訪出差，包含住宿費、交通費及餐費。已附相關發票及收據。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '李文華',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-28 14:20',
        comment: '出差報銷申請'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '陳經理',
        role: '銷售部主管',
        status: 'completed',
        action: '通過',
        time: '2026-02-28 16:30',
        comment: '費用合理，同意報銷'
      },
      { id: 3, nodeName: '財務審核', approver: '林會計', role: '財務專員', status: 'current' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'AP-2026-0295': {
    code: 'AP-2026-0295',
    applicant: '王美玲',
    department: '人事部',
    position: '人事專員',
    type: '加班申請',
    summary: '加班 4 小時 (02/28)',
    status: '通過',
    submitTime: '2026-02-27 17:00',
    attachments: [],
    details: {
      加班日期: '2026-02-28',
      加班時段: '18:00 ~ 22:00',
      加班時數: '4 小時',
      加班類型: '平日加班',
      加班事由: '月底薪資結算作業，需配合完成全公司薪資計算及核對。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '王美玲',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-27 17:00',
        comment: '月底薪資結算加班'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '趙主管',
        role: '人事部主管',
        status: 'completed',
        action: '通過',
        time: '2026-02-27 17:30',
        comment: '同意加班'
      },
      {
        id: 3,
        nodeName: '人事部審核',
        approver: '系統自動',
        role: '同部門免審',
        status: 'completed',
        action: '自動通過',
        time: '2026-02-27 17:30',
        comment: '同部門申請，系統自動審核通過'
      },
      {
        id: 4,
        nodeName: '審批完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-02-27 17:31'
      }
    ]
  },
  'AP-2026-0290': {
    code: 'AP-2026-0290',
    applicant: '陳大偉',
    department: '市場部',
    position: '市場經理',
    type: '出差申請',
    summary: '上海出差 3 天 (03/10-03/12)',
    status: '通過',
    submitTime: '2026-02-26 10:15',
    attachments: ['出差行程表.pdf', '客戶會議邀請函.pdf'],
    details: {
      出差目的地: '上海',
      起始日期: '2026-03-10',
      結束日期: '2026-03-12',
      出差天數: '3 天',
      預估費用: 'NT$ 25,000',
      出差事由: '參加上海客戶年度合作會議，洽談下半年合作方案。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '陳大偉',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-26 10:15',
        comment: '上海客戶會議出差'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '吳總監',
        role: '市場部總監',
        status: 'completed',
        action: '通過',
        time: '2026-02-26 14:00',
        comment: '重要客戶會議，同意出差'
      },
      {
        id: 3,
        nodeName: '人事部審核',
        approver: '劉美君',
        role: '人事專員',
        status: 'completed',
        action: '通過',
        time: '2026-02-26 16:00',
        comment: '已確認出差保險'
      },
      {
        id: 4,
        nodeName: '審批完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-02-26 16:01'
      }
    ]
  },
  'AP-2026-0288': {
    code: 'AP-2026-0288',
    applicant: '林佳蓉',
    department: '財務部',
    position: '會計師',
    type: '請假申請',
    subType: '病假',
    summary: '病假 1 天 (02/25)',
    status: '駁回',
    submitTime: '2026-02-25 08:45',
    attachments: ['診斷證明書.pdf'],
    details: {
      假別: '病假',
      起始日期: '2026-02-25',
      結束日期: '2026-02-25',
      請假天數: '1 天',
      請假事由: '身體不適需前往醫院就診。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '林佳蓉',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-25 08:45',
        comment: '身體不適需就醫'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '財務主管',
        role: '財務部主管',
        status: 'rejected',
        action: '駁回',
        time: '2026-02-25 09:30',
        comment: '當日為月結日，請改期或提供更詳細的診斷證明'
      },
      { id: 3, nodeName: '人事部審核', approver: '劉美君', role: '人事專員', status: 'pending' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'AP-2026-0285': {
    code: 'AP-2026-0285',
    applicant: '黃志偉',
    department: '技術部',
    position: '後端工程師',
    type: '報銷申請',
    subType: '交通費',
    summary: '交通費報銷 NT$2,300',
    status: '撤回',
    submitTime: '2026-02-24 11:30',
    attachments: ['交通費收據.pdf'],
    details: {
      報銷類別: '交通費',
      報銷金額: 'NT$ 2,300',
      發生日期: '2026-02-20',
      報銷事由: '客戶現場支援交通費用。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '黃志偉',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-24 11:30',
        comment: '交通費報銷'
      },
      {
        id: 2,
        nodeName: '已撤回',
        approver: '黃志偉',
        role: '申請人',
        status: 'completed',
        action: '撤回',
        time: '2026-02-24 15:00',
        comment: '金額有誤，需重新提交'
      }
    ]
  },
  'AP-2026-0310': {
    code: 'AP-2026-0310',
    applicant: '趙志強',
    department: '技術部',
    position: '後端工程師',
    type: '加班申請',
    summary: '加班 3 小時 (03/02)',
    status: '待審',
    submitTime: '2026-03-02 18:00',
    attachments: [],
    details: {
      加班日期: '2026-03-02',
      加班時段: '19:00 ~ 22:00',
      加班時數: '3 小時',
      加班類型: '平日加班',
      加班事由: '趕專案上線，需進行最終測試與部署。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '趙志強',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-02 18:00',
        comment: '趕專案上線加班'
      },
      { id: 2, nodeName: '部門主管審批', approver: '王大明', role: '技術部主管', status: 'current' },
      { id: 3, nodeName: '人事部備案', approver: '劉美君', role: '人事專員', status: 'pending' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'AP-2026-0312': {
    code: 'AP-2026-0312',
    applicant: '周雅婷',
    department: '市場部',
    position: '市場專員',
    type: '出差申請',
    summary: '北京出差 5 天 (03/15-03/19)',
    status: '待審',
    submitTime: '2026-02-25 09:00',
    attachments: ['出差計畫書.pdf'],
    details: {
      出差目的地: '北京',
      起始日期: '2026-03-15',
      結束日期: '2026-03-19',
      出差天數: '5 天',
      預估費用: 'NT$ 45,000',
      出差事由: '參加行業峰會暨客戶拓展活動。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '周雅婷',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-25 09:00',
        comment: '北京行業峰會出差'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '吳總監',
        role: '市場部總監',
        status: 'completed',
        action: '通過',
        time: '2026-02-25 14:00',
        comment: '同意出差'
      },
      { id: 3, nodeName: '總經理審批', approver: '總經理', role: '總經理', status: 'current' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'AP-2026-0315': {
    code: 'AP-2026-0315',
    applicant: '吳建國',
    department: '人事部',
    position: '人事主管',
    type: '請假申請',
    subType: '事假',
    summary: '事假 1 天 (03/04)',
    status: '待審',
    submitTime: '2026-03-03 08:00',
    attachments: [],
    details: {
      假別: '事假',
      起始日期: '2026-03-04',
      結束日期: '2026-03-04',
      請假天數: '1 天',
      請假事由: '家中有事需處理。'
    },
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '吳建國',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-03 08:00',
        comment: '家中有事'
      },
      { id: 2, nodeName: '部門主管審批', approver: '趙主管', role: '人事部主管', status: 'current' },
      { id: 3, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  }
};
