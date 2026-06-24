import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  LogOut,
  MessageSquare,
  Paperclip,
  Plane,
  Receipt,
  RotateCcw,
  Send,
  Timer,
  User,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type AppStatus = '審核中' | '已撤回' | '已核准' | '已駁回' | '待審核' | '草稿';
type AppCategory = 'expense' | 'overtime' | 'resignation' | 'travel';

interface ApprovalStep {
  action?: string;
  approver: string;
  comment?: string;
  id: number;
  nodeName: string;
  role: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  time?: string;
}

interface AppData {
  applicant: string;
  attachments: string[];
  category: AppCategory;
  code: string;
  department: string;
  fields: { label: string; value: string }[];
  position: string;
  reason: string;
  status: AppStatus;
  steps: ApprovalStep[];
  submitTime: string;
  subType: string;
}

const statusConfig: Record<AppStatus, { color: string; icon: React.ElementType; label: string }> = {
  草稿: { color: 'bg-muted text-muted-foreground', icon: FileText, label: '草稿' },
  待審核: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: '待審核' },
  審核中: { color: 'bg-accent/10 text-accent border-accent/20', icon: Clock, label: '審核中' },
  已核准: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, label: '已核准' },
  已駁回: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle, label: '已駁回' },
  已撤回: { color: 'bg-muted text-muted-foreground', icon: RotateCcw, label: '已撤回' }
};

const categoryMeta: Record<AppCategory, { icon: React.ElementType; label: string }> = {
  overtime: { label: '加班申請', icon: Timer },
  travel: { label: '出差申請', icon: Plane },
  expense: { label: '報銷申請', icon: Receipt },
  resignation: { label: '離職申請', icon: LogOut }
};

const stepStatusStyle: Record<string, string> = {
  completed: 'border-success bg-success text-success-foreground',
  current: 'border-warning bg-warning text-warning-foreground animate-pulse',
  pending: 'border-border bg-muted text-muted-foreground',
  rejected: 'border-destructive bg-destructive text-destructive-foreground'
};

const stepLineStyle: Record<string, string> = {
  completed: 'bg-success',
  current: 'bg-warning',
  pending: 'bg-border',
  rejected: 'bg-destructive'
};

const defaultSteps = (
  status: 'completed' | 'current' | 'pending' | 'rejected',
  applicant: string,
  submitTime: string
): ApprovalStep[] => [
  {
    id: 1,
    nodeName: '提交申請',
    approver: applicant,
    role: '申請人',
    status: 'completed',
    action: '提交',
    time: submitTime
  },
  {
    id: 2,
    nodeName: '部門主管審批',
    approver: '王大明',
    role: '部門主管',
    status: status === 'completed' || status === 'rejected' ? status : 'current'
  },
  {
    id: 3,
    nodeName: '人事部審核',
    approver: '劉美君',
    role: '人事專員',
    status: status === 'completed' ? 'completed' : 'pending'
  },
  { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: status === 'completed' ? 'completed' : 'pending' }
];

const mockAppData: Record<string, AppData> = {
  // 加班
  'OT-2026-0012': {
    code: 'OT-2026-0012',
    category: 'overtime',
    applicant: '張小明',
    department: '技術部',
    position: '前端工程師',
    status: '已核准',
    submitTime: '2026-02-24 17:00',
    subType: '平日加班',
    fields: [
      { label: '加班日期', value: '2026-02-25' },
      { label: '加班時段', value: '18:00 ~ 21:00' },
      { label: '加班時長', value: '3 小時' },
      { label: '加班類型', value: '平日加班' }
    ],
    reason: '專案上線需進行最後的部署與驗證工作。',
    attachments: [],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '張小明',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-24 17:00'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '王大明',
        role: '技術部主管',
        status: 'completed',
        action: '通過',
        time: '2026-02-24 17:30',
        comment: '專案上線必要，同意加班'
      },
      {
        id: 3,
        nodeName: '人事部審核',
        approver: '劉美君',
        role: '人事專員',
        status: 'completed',
        action: '通過',
        time: '2026-02-24 18:00'
      },
      {
        id: 4,
        nodeName: '審批完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-02-24 18:01'
      }
    ]
  },
  'OT-2026-0010': {
    code: 'OT-2026-0010',
    category: 'overtime',
    applicant: '林佳蓉',
    department: '財務部',
    position: '會計師',
    status: '待審核',
    submitTime: '2026-02-25 09:00',
    subType: '假日加班',
    fields: [
      { label: '加班日期', value: '2026-02-26' },
      { label: '加班時段', value: '09:00 ~ 13:00' },
      { label: '加班時長', value: '4 小時' },
      { label: '加班類型', value: '假日加班' }
    ],
    reason: '月結報告需於週一前完成。',
    attachments: [],
    steps: defaultSteps('current', '林佳蓉', '2026-02-25 09:00')
  },
  // 出差
  'TR-2026-0005': {
    code: 'TR-2026-0005',
    category: 'travel',
    applicant: '陳大偉',
    department: '市場部',
    position: '市場經理',
    status: '待審核',
    submitTime: '2026-03-06 10:00',
    subType: '國內出差',
    fields: [
      { label: '目的地', value: '台中市' },
      { label: '出差日期', value: '2026-03-20 ~ 2026-03-22' },
      { label: '出差天數', value: '3 天' },
      { label: '預估預算', value: 'NT$15,000' }
    ],
    reason: '參加行業展覽會，拓展市場合作機會。',
    attachments: ['展覽邀請函.pdf'],
    steps: defaultSteps('current', '陳大偉', '2026-03-06 10:00')
  },
  'TR-2026-0004': {
    code: 'TR-2026-0004',
    category: 'travel',
    applicant: '李文華',
    department: '銷售部',
    position: '業務經理',
    status: '已核准',
    submitTime: '2026-03-03 09:00',
    subType: '國內出差',
    fields: [
      { label: '目的地', value: '高雄市' },
      { label: '出差日期', value: '2026-03-15 ~ 2026-03-16' },
      { label: '出差天數', value: '2 天' },
      { label: '預估預算', value: 'NT$8,000' }
    ],
    reason: '拜訪重要客戶，討論合作方案。',
    attachments: [],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '李文華',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-03 09:00'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '陳經理',
        role: '銷售部主管',
        status: 'completed',
        action: '通過',
        time: '2026-03-03 10:00',
        comment: '重要客戶，請務必做好拜訪準備'
      },
      {
        id: 3,
        nodeName: '人事部審核',
        approver: '劉美君',
        role: '人事專員',
        status: 'completed',
        action: '通過',
        time: '2026-03-03 11:00'
      },
      {
        id: 4,
        nodeName: '審批完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-03-03 11:01'
      }
    ]
  },
  'TR-2026-0003': {
    code: 'TR-2026-0003',
    category: 'travel',
    applicant: '張小明',
    department: '技術部',
    position: '前端工程師',
    status: '審核中',
    submitTime: '2026-03-01 14:00',
    subType: '海外出差',
    fields: [
      { label: '目的地', value: '東京・日本' },
      { label: '出差日期', value: '2026-04-01 ~ 2026-04-05' },
      { label: '出差天數', value: '5 天' },
      { label: '預估預算', value: 'NT$45,000' }
    ],
    reason: '參加技術交流會議，學習最新前端技術。',
    attachments: ['會議邀請函.pdf', '機票報價單.pdf'],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '張小明',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-01 14:00'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '王大明',
        role: '技術部主管',
        status: 'completed',
        action: '通過',
        time: '2026-03-02 09:00',
        comment: '有助團隊技術提升'
      },
      { id: 3, nodeName: '總經理審批', approver: '林總經理', role: '總經理', status: 'current' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  // 報銷
  'EX-2026-0008': {
    code: 'EX-2026-0008',
    category: 'expense',
    applicant: '李文華',
    department: '銷售部',
    position: '業務經理',
    status: '待審核',
    submitTime: '2026-03-06 11:00',
    subType: '差旅費',
    fields: [
      { label: '報銷類型', value: '差旅費' },
      { label: '報銷金額', value: 'NT$12,500' },
      { label: '發生日期', value: '2026-03-05' }
    ],
    reason: '客戶拜訪差旅報銷，含交通及住宿。',
    attachments: ['交通收據.pdf', '住宿發票.pdf'],
    steps: defaultSteps('current', '李文華', '2026-03-06 11:00')
  },
  'EX-2026-0007': {
    code: 'EX-2026-0007',
    category: 'expense',
    applicant: '王美玲',
    department: '人事部',
    position: '人事專員',
    status: '已核准',
    submitTime: '2026-03-03 09:30',
    subType: '辦公用品',
    fields: [
      { label: '報銷類型', value: '辦公用品' },
      { label: '報銷金額', value: 'NT$3,200' },
      { label: '發生日期', value: '2026-03-02' }
    ],
    reason: '採購辦公文具，包含影印紙與文件夾。',
    attachments: ['購買收據.pdf'],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '王美玲',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-03 09:30'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '趙主管',
        role: '人事部主管',
        status: 'completed',
        action: '通過',
        time: '2026-03-03 10:00'
      },
      {
        id: 3,
        nodeName: '財務審核',
        approver: '林佳蓉',
        role: '財務專員',
        status: 'completed',
        action: '通過',
        time: '2026-03-03 14:00'
      },
      {
        id: 4,
        nodeName: '審批完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-03-03 14:01'
      }
    ]
  },
  'EX-2026-0006': {
    code: 'EX-2026-0006',
    category: 'expense',
    applicant: '陳大偉',
    department: '市場部',
    position: '市場經理',
    status: '已駁回',
    submitTime: '2026-03-01 15:00',
    subType: '餐費',
    fields: [
      { label: '報銷類型', value: '餐費' },
      { label: '報銷金額', value: 'NT$2,800' },
      { label: '發生日期', value: '2026-02-28' }
    ],
    reason: '客戶餐敘。',
    attachments: [],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '陳大偉',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-01 15:00'
      },
      {
        id: 2,
        nodeName: '部門主管審批',
        approver: '張總監',
        role: '市場部主管',
        status: 'rejected',
        action: '駁回',
        time: '2026-03-02 09:00',
        comment: '缺少用餐發票，請補齊後重新申請'
      },
      { id: 3, nodeName: '財務審核', approver: '林佳蓉', role: '財務專員', status: 'pending' },
      { id: 4, nodeName: '審批完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  // 離職
  'RS-2026-0003': {
    code: 'RS-2026-0003',
    category: 'resignation',
    applicant: '周建國',
    department: '技術部',
    position: '資深後端工程師',
    status: '審核中',
    submitTime: '2026-03-01 10:00',
    subType: '自願離職',
    fields: [
      { label: '離職類型', value: '自願離職' },
      { label: '預計離職日', value: '2026-04-01' },
      { label: '最後工作日', value: '2026-03-31' },
      { label: '是否接受慰留', value: '否' }
    ],
    reason: '個人職涯規劃，希望往管理方向發展，已獲得其他公司 offer。',
    attachments: [],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '周建國',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-03-01 10:00',
        comment: '感謝公司栽培，因個人職涯規劃提出離職'
      },
      {
        id: 2,
        nodeName: '部門主管面談',
        approver: '王大明',
        role: '技術部主管',
        status: 'completed',
        action: '已面談',
        time: '2026-03-03 14:00',
        comment: '已與周建國進行面談，確認離職意願堅定'
      },
      { id: 3, nodeName: '人事部審核', approver: '劉美君', role: '人事專員', status: 'current' },
      { id: 4, nodeName: '工作交接', approver: '待指派', role: '交接人', status: 'pending' },
      { id: 5, nodeName: '離職完成', approver: '系統', role: '', status: 'pending' }
    ]
  },
  'RS-2026-0002': {
    code: 'RS-2026-0002',
    category: 'resignation',
    applicant: '吳雅琪',
    department: '銷售部',
    position: '業務代表',
    status: '已核准',
    submitTime: '2026-02-15 09:00',
    subType: '自願離職',
    fields: [
      { label: '離職類型', value: '自願離職' },
      { label: '預計離職日', value: '2026-03-15' },
      { label: '最後工作日', value: '2026-03-14' },
      { label: '是否接受慰留', value: '否' }
    ],
    reason: '因家庭因素需搬遷至外縣市，無法繼續通勤。',
    attachments: [],
    steps: [
      {
        id: 1,
        nodeName: '提交申請',
        approver: '吳雅琪',
        role: '申請人',
        status: 'completed',
        action: '提交',
        time: '2026-02-15 09:00'
      },
      {
        id: 2,
        nodeName: '部門主管面談',
        approver: '陳經理',
        role: '銷售部主管',
        status: 'completed',
        action: '已面談',
        time: '2026-02-17 10:00',
        comment: '理解家庭因素，祝福一切順利'
      },
      {
        id: 3,
        nodeName: '人事部審核',
        approver: '劉美君',
        role: '人事專員',
        status: 'completed',
        action: '通過',
        time: '2026-02-18 09:00'
      },
      {
        id: 4,
        nodeName: '工作交接',
        approver: '李文華',
        role: '交接人',
        status: 'completed',
        action: '交接完成',
        time: '2026-03-10 17:00',
        comment: '客戶資料與案件已全數交接完畢'
      },
      {
        id: 5,
        nodeName: '離職完成',
        approver: '系統',
        role: '',
        status: 'completed',
        action: '完成',
        time: '2026-03-14 18:00'
      }
    ]
  },
  'RS-2026-0001': {
    code: 'RS-2026-0001',
    category: 'resignation',
    applicant: '劉志明',
    department: '財務部',
    position: '財務分析師',
    status: '待審核',
    submitTime: '2026-03-07 14:30',
    subType: '自願離職',
    fields: [
      { label: '離職類型', value: '自願離職' },
      { label: '預計離職日', value: '2026-04-15' },
      { label: '最後工作日', value: '2026-04-14' },
      { label: '是否接受慰留', value: '是' }
    ],
    reason: '希望轉換跑道至其他產業，尋求不同的職涯體驗。',
    attachments: [],
    steps: defaultSteps('current', '劉志明', '2026-03-07 14:30')
  }
};

// Also handle overtime records not listed above
['OT-2026-0011', 'OT-2026-0009', 'OT-2026-0008'].forEach(id => {
  if (!mockAppData[id]) {
    const records: Record<string, Partial<AppData>> = {
      'OT-2026-0011': {
        code: 'OT-2026-0011',
        category: 'overtime',
        applicant: '黃志偉',
        department: '技術部',
        position: '後端工程師',
        status: '已核准',
        submitTime: '2026-02-23 18:00',
        subType: '平日加班',
        fields: [
          { label: '加班日期', value: '2026-02-24' },
          { label: '加班時段', value: '18:00 ~ 20:00' },
          { label: '加班時長', value: '2 小時' },
          { label: '加班類型', value: '平日加班' }
        ],
        reason: 'Bug 修復，需在上線前解決。',
        attachments: []
      },
      'OT-2026-0009': {
        code: 'OT-2026-0009',
        category: 'overtime',
        applicant: '陳大偉',
        department: '市場部',
        position: '市場經理',
        status: '待審核',
        submitTime: '2026-02-28 17:30',
        subType: '平日加班',
        fields: [
          { label: '加班日期', value: '2026-03-01' },
          { label: '加班時段', value: '18:00 ~ 20:30' },
          { label: '加班時長', value: '2.5 小時' },
          { label: '加班類型', value: '平日加班' }
        ],
        reason: '活動策劃趕工。',
        attachments: []
      },
      'OT-2026-0008': {
        code: 'OT-2026-0008',
        category: 'overtime',
        applicant: '李文華',
        department: '銷售部',
        position: '業務經理',
        status: '審核中',
        submitTime: '2026-03-01 10:00',
        subType: '假日加班',
        fields: [
          { label: '加班日期', value: '2026-03-02' },
          { label: '加班時段', value: '09:00 ~ 15:00' },
          { label: '加班時長', value: '6 小時' },
          { label: '加班類型', value: '假日加班' }
        ],
        reason: '客戶演示準備。',
        attachments: []
      }
    };
    const r = records[id]!;
    const statusMap: Record<string, 'completed' | 'current' | 'rejected'> = {
      已核准: 'completed',
      待審核: 'current',
      審核中: 'current',
      已駁回: 'rejected'
    };
    mockAppData[id] = {
      ...r,
      steps:
        r.status === '已核准'
          ? [
              {
                id: 1,
                nodeName: '提交申請',
                approver: r.applicant!,
                role: '申請人',
                status: 'completed',
                action: '提交',
                time: r.submitTime!
              },
              {
                id: 2,
                nodeName: '部門主管審批',
                approver: '主管',
                role: '部門主管',
                status: 'completed',
                action: '通過',
                time: r.submitTime!
              },
              {
                id: 3,
                nodeName: '人事部審核',
                approver: '劉美君',
                role: '人事專員',
                status: 'completed',
                action: '通過',
                time: r.submitTime!
              },
              {
                id: 4,
                nodeName: '審批完成',
                approver: '系統',
                role: '',
                status: 'completed',
                action: '完成',
                time: r.submitTime!
              }
            ]
          : defaultSteps(statusMap[r.status as string] || 'current', r.applicant!, r.submitTime!)
    } as AppData;
  }
});

export default function ApplicationDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [approvalComment, setApprovalComment] = useState('');

  const data = appId ? mockAppData[appId] : null;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該申請記錄</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/attendance/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回申請列表
        </Button>
      </div>
    );
  }

  const sc = statusConfig[data.status];
  const StatusIcon = sc.icon;
  const cm = categoryMeta[data.category];
  const CategoryIcon = cm.icon;
  const isActionable = data.status === '待審核' || data.status === '審核中';
  const canWithdraw = data.status === '待審核' || data.status === '審核中';

  const handleAction = (action: string) => {
    toast.success(`已${action}申請 ${data.code}`);
    navigate('/attendance/applications');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/attendance/applications')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-primary" />
              {cm.label}詳情
              <span className="text-lg font-mono text-muted-foreground">{data.code}</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">提交於 {data.submitTime}</p>
          </div>
        </div>
        <Badge className={`${sc.color} border text-sm px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {sc.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 text-primary" />
                申請資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">申請人</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {data.applicant}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">部門</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {data.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">職位</p>
                  <p className="text-sm font-medium text-foreground">{data.position}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">申請類別</p>
                  <Badge variant="outline">{data.subType}</Badge>
                </div>
                {data.fields.map((f, i) => (
                  <div key={i}>
                    <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                    <p className="text-sm font-medium text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div>
                <p className="text-xs text-muted-foreground mb-1">申請事由</p>
                <p className="text-sm text-foreground leading-relaxed">{data.reason}</p>
              </div>

              {data.attachments.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">附件</p>
                    <div className="space-y-1">
                      {data.attachments.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isActionable && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  審批操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">審批意見</p>
                  <Textarea
                    placeholder="請輸入審批意見（選填）..."
                    value={approvalComment}
                    onChange={e => setApprovalComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleAction('核准')}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    核准
                  </Button>
                  <Button variant="destructive" onClick={() => handleAction('駁回')}>
                    <XCircle className="h-4 w-4 mr-1" />
                    駁回
                  </Button>
                  <Button variant="outline" onClick={() => handleAction('轉簽')}>
                    <Send className="h-4 w-4 mr-1" />
                    轉簽
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canWithdraw && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => handleAction('撤回')}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                撤回申請
              </Button>
            </div>
          )}
        </div>

        {/* Right: Approval Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                審批流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {data.steps.map((step, index) => {
                  const isLast = index === data.steps.length - 1;
                  const StepIcon =
                    (
                      { completed: CheckCircle2, rejected: XCircle, current: Clock } as Record<
                        string,
                        typeof CheckCircle2
                      >
                    )[step.status] ?? FileText;

                  return (
                    <div key={step.id} className="relative flex gap-3">
                      {!isLast && (
                        <div
                          className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] ${stepLineStyle[step.status]}`}
                        />
                      )}
                      <div
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${stepStatusStyle[step.status]}`}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                        <p className="text-sm font-medium text-foreground">{step.nodeName}</p>
                        {step.approver && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.approver}
                            {step.role ? ` · ${step.role}` : ''}
                          </p>
                        )}
                        {step.action && (
                          <div className="mt-1.5">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                (
                                  {
                                    通過: 'bg-success/10 text-success border-success/20',
                                    自動通過: 'bg-success/10 text-success border-success/20',
                                    完成: 'bg-success/10 text-success border-success/20',
                                    已面談: 'bg-success/10 text-success border-success/20',
                                    交接完成: 'bg-success/10 text-success border-success/20',
                                    駁回: 'bg-destructive/10 text-destructive border-destructive/20'
                                  } as Record<string, string>
                                )[step.action] ?? 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {step.action}
                            </Badge>
                          </div>
                        )}
                        {step.time && <p className="text-xs text-muted-foreground mt-1">{step.time}</p>}
                        {step.comment && (
                          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border">
                            <p className="text-xs text-foreground leading-relaxed">{step.comment}</p>
                          </div>
                        )}
                        {step.status === 'current' && !step.action && (
                          <p className="text-xs text-warning mt-1 font-medium">等待審批中...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
