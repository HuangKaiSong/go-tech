import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  CheckCircle,
  Clock,
  Eye,
  History,
  Search,
  Send,
  Wallet,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { type PayrollDistRecord, mockDistEmployees, mockDistRecords } from './PayrollDistribute';

// ─── Types ───

interface ApprovalStep {
  action?: string;
  approver: string;
  comment?: string;
  level: number;
  role: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  time?: string;
  title: string;
}

interface ApprovalLog {
  action: '初審通過' | '執行發放' | '審核駁回' | '提交審核' | '終審通過' | '複審通過' | '轉簽' | '退回修改';
  batchId: string;
  comment: string;
  id: string;
  operator: string;
  role: string;
  time: string;
}

interface AnomalyItem {
  amount: number;
  department: string;
  description: string;
  employeeId: string;
  name: string;
  severity: 'error' | 'info' | 'warning';
  type: '加班異常' | '扣款異常' | '新進員工' | '薪資異動' | '離職結算';
}

// ─── Mock Data ───

const getApprovalSteps = (record: PayrollDistRecord): ApprovalStep[] => {
  const isApproved = ['已審核', '發放中', '已發放'].includes(record.status);
  return [
    {
      level: 1,
      title: '提交審核',
      approver: record.createdBy,
      role: '薪資專員',
      status: 'completed',
      action: '提交',
      time: record.createdAt,
      comment: record.note || '批次已提交審核'
    },
    {
      level: 2,
      title: '部門主管初審',
      approver: isApproved ? '張經理' : '—',
      role: '人事部主管',
      status: (() => {
        if (isApproved) return 'completed';
        if (record.status === '待審核') return 'current';
        return 'pending';
      })(),
      action: isApproved ? '通過' : undefined,
      time: isApproved ? record.updatedAt : undefined,
      comment: isApproved ? '人員及金額已核對' : undefined
    },
    {
      level: 3,
      title: '財務經理複審',
      approver: isApproved ? '林財務' : '—',
      role: '財務經理',
      status: isApproved ? 'completed' : 'pending',
      action: isApproved ? '通過' : undefined,
      time: isApproved ? record.updatedAt : undefined,
      comment: isApproved ? '預算無超支，同意' : undefined
    },
    {
      level: 4,
      title: '總經理終審',
      approver: isApproved ? record.approvedBy || '陳總監' : '—',
      role: '總經理',
      status: isApproved ? 'completed' : 'pending',
      action: isApproved ? '核准' : undefined,
      time: isApproved ? record.updatedAt : undefined,
      comment: isApproved ? '同意發放' : undefined
    }
  ];
};

const mockApprovalLogs: ApprovalLog[] = [
  {
    id: 'AL-001',
    batchId: 'PD-202602',
    action: '提交審核',
    operator: '王小美',
    role: '薪資專員',
    time: '2026-02-20 09:30',
    comment: '2月份薪資已計算完成，請審核'
  },
  {
    id: 'AL-002',
    batchId: 'PD-202602',
    action: '初審通過',
    operator: '張經理',
    role: '人事部主管',
    time: '2026-02-20 14:15',
    comment: '人員名單及金額已核對無誤'
  },
  {
    id: 'AL-003',
    batchId: 'PD-202602',
    action: '複審通過',
    operator: '林財務',
    role: '財務經理',
    time: '2026-02-21 10:30',
    comment: '已確認預算額度，同意發放'
  },
  {
    id: 'AL-004',
    batchId: 'PD-202602',
    action: '終審通過',
    operator: '陳總監',
    role: '總經理',
    time: '2026-02-21 14:15',
    comment: '已核對，同意發放'
  },
  {
    id: 'AL-005',
    batchId: 'PD-202602',
    action: '執行發放',
    operator: '系統',
    role: '系統',
    time: '2026-02-27 10:00',
    comment: '銀行轉帳批次已發送'
  },
  {
    id: 'AL-006',
    batchId: 'PD-202601',
    action: '提交審核',
    operator: '王小美',
    role: '薪資專員',
    time: '2026-01-18 10:00',
    comment: '1月份薪資請審核'
  },
  {
    id: 'AL-007',
    batchId: 'PD-202601',
    action: '初審通過',
    operator: '張經理',
    role: '人事部主管',
    time: '2026-01-19 09:00',
    comment: '確認無誤'
  },
  {
    id: 'AL-008',
    batchId: 'PD-202601',
    action: '複審通過',
    operator: '林財務',
    role: '財務經理',
    time: '2026-01-19 14:00',
    comment: '同意'
  },
  {
    id: 'AL-009',
    batchId: 'PD-202601',
    action: '終審通過',
    operator: '陳總監',
    role: '總經理',
    time: '2026-01-20 11:30',
    comment: '同意'
  },
  {
    id: 'AL-010',
    batchId: 'PD-202603',
    action: '提交審核',
    operator: '王小美',
    role: '薪資專員',
    time: '2026-03-10 08:00',
    comment: '3月份正常薪資批次已提交'
  },
  {
    id: 'AL-011',
    batchId: 'PD-202603-B',
    action: '提交審核',
    operator: '王小美',
    role: '薪資專員',
    time: '2026-03-08 09:30',
    comment: 'Q1業績獎金批次已提交'
  }
];

const mockAnomalies: Record<string, AnomalyItem[]> = {
  'PD-202603': [
    {
      employeeId: 'EMP-001',
      name: '張小明',
      department: '技術部',
      type: '薪資異動',
      description: '本月薪資較上月增加 HK$ 3,500（晉升調薪）',
      amount: 3500,
      severity: 'info'
    },
    {
      employeeId: 'EMP-007',
      name: '趙新人',
      department: '銷售部',
      type: '新進員工',
      description: '本月新入職，按比例計薪 18 天',
      amount: 28800,
      severity: 'info'
    },
    {
      employeeId: 'EMP-004',
      name: '陳大偉',
      department: '技術部',
      type: '加班異常',
      description: '本月加班 52 小時，超過公司標準上限 40 小時',
      amount: 8125,
      severity: 'warning'
    },
    {
      employeeId: 'EMP-008',
      name: '周離職',
      department: '行政部',
      type: '離職結算',
      description: '3/15 離職，含未休年假 5 天折算及離職補償',
      amount: 45200,
      severity: 'warning'
    }
  ],
  'PD-202603-B': [
    {
      employeeId: 'EMP-002',
      name: '李文華',
      department: '銷售部',
      type: '薪資異動',
      description: 'Q1業績獎金 HK$ 52,000，為部門最高',
      amount: 52000,
      severity: 'info'
    },
    {
      employeeId: 'EMP-009',
      name: '吳業務',
      department: '銷售部',
      type: '扣款異常',
      description: '扣除上季度預支佣金 HK$ 12,000',
      amount: -12000,
      severity: 'warning'
    }
  ]
};

const actionColors: Record<string, string> = {
  提交審核: 'bg-muted text-muted-foreground border-border',
  初審通過: 'bg-primary/10 text-primary border-primary/20',
  複審通過: 'bg-accent/10 text-accent-foreground border-accent/20',
  終審通過: 'bg-success/10 text-success border-success/20',
  審核駁回: 'bg-destructive/10 text-destructive border-destructive/20',
  退回修改: 'bg-warning/10 text-warning border-warning/20',
  轉簽: 'bg-primary/10 text-primary border-primary/20',
  執行發放: 'bg-success/10 text-success border-success/20'
};

const statusColors: Record<string, string> = {
  草稿: 'bg-muted text-muted-foreground border-border',
  待審核: 'bg-warning/10 text-warning border-warning/20',
  已審核: 'bg-accent/10 text-accent-foreground border-accent/20',
  發放中: 'bg-primary/10 text-primary border-primary/20',
  已發放: 'bg-success/10 text-success border-success/20',
  已取消: 'bg-destructive/10 text-destructive border-destructive/20'
};

const severityConfig = {
  info: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: AlertCircle },
  warning: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle },
  error: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle }
};

const stepBadgeClass = (status: ApprovalStep['status']) => {
  if (status === 'completed') return 'bg-success text-success-foreground';
  if (status === 'current') return 'bg-primary text-primary-foreground';
  return 'bg-muted text-muted-foreground';
};

// ─── Dialog components ───

interface ApproveDialogProps {
  comment: string;
  onCancel: () => void;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  target: PayrollDistRecord | null;
}

const ApproveDialog = ({ comment, onCancel, onCommentChange, onConfirm, target }: ApproveDialogProps) => {
  const hasWarning = target !== null && (mockAnomalies[target.id] || []).some(a => a.severity !== 'info');
  return (
    <Dialog open={Boolean(target)} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" /> 審核通過確認
          </DialogTitle>
          <DialogDescription>確認通過 {target?.period} 的發薪批次（部門主管初審）</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">批次編號</span>
              <span className="font-medium">{target?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">發薪人數</span>
              <span className="font-medium">{target?.employeeCount} 人</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">發薪日期</span>
              <span className="font-medium">{target?.payDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">發薪方式</span>
              <span className="font-medium">{target?.payMethod}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">應發總額</span>
              <span className="font-medium">HK$ {target?.totalGross.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">扣款總額</span>
              <span className="font-medium text-destructive">- HK$ {target?.totalDeduction.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>實發總額</span>
              <span className="text-primary">HK$ {target?.totalNet.toLocaleString()}</span>
            </div>
          </div>
          {hasWarning && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
              <p className="text-sm font-medium text-warning flex items-center gap-1 mb-1">
                <AlertTriangle className="h-4 w-4" /> 此批次包含異常項目
              </p>
              <p className="text-xs text-muted-foreground">請確認已檢視異常項目後再進行審核。</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">審核意見（選填）</label>
            <Textarea
              placeholder="輸入審核意見..."
              value={comment}
              onChange={e => onCommentChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={onConfirm}>
            <CheckCircle className="h-4 w-4" /> 確認通過
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface BatchApproveDialogProps {
  comment: string;
  onCancel: () => void;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  open: boolean;
  records: PayrollDistRecord[];
  selectedIds: string[];
}

const BatchApproveDialog = ({
  comment,
  onCancel,
  onCommentChange,
  onConfirm,
  open,
  records,
  selectedIds
}: BatchApproveDialogProps) => {
  const total = selectedIds.reduce((s, id) => s + (records.find(r => r.id === id)?.totalNet || 0), 0);
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-success" /> 批量審核確認
          </DialogTitle>
          <DialogDescription>即將批量通過 {selectedIds.length} 筆發薪批次</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            {selectedIds.map(id => {
              const r = records.find(rec => rec.id === id);
              if (!r) return null;
              return (
                <div key={id} className="flex justify-between">
                  <span>
                    {r.period} ({r.id})
                  </span>
                  <span className="font-medium">HK$ {r.totalNet.toLocaleString()}</span>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>合計</span>
              <span className="text-primary">HK$ {total.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">審核意見（選填）</label>
            <Textarea
              placeholder="輸入批量審核意見..."
              value={comment}
              onChange={e => onCommentChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={onConfirm}>
            <CheckCheck className="h-4 w-4" /> 確認批量通過
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ReasonDialogProps {
  description: string;
  icon: typeof XCircle;
  iconClassName: string;
  noticeClassName: string;
  noticeIcon: typeof AlertCircle;
  noticeIconClassName: string;
  noticeText: string;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (v: string) => void;
  placeholder: string;
  reason: string;
  reasonLabel: string;
  submitClassName?: string;
  submitLabel: string;
  submitVariant?: 'default' | 'destructive';
  target: PayrollDistRecord | null;
  title: string;
}

const ReasonDialog = ({
  description,
  icon: Icon,
  iconClassName,
  noticeClassName,
  noticeIcon: NoticeIcon,
  noticeIconClassName,
  noticeText,
  onCancel,
  onConfirm,
  onReasonChange,
  placeholder,
  reason,
  reasonLabel,
  submitClassName = '',
  submitLabel,
  submitVariant = 'default',
  target,
  title
}: ReasonDialogProps) => (
  <Dialog open={Boolean(target)} onOpenChange={onCancel}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconClassName}`} /> {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className={`rounded-lg p-3 flex items-start gap-2 border ${noticeClassName}`}>
          <NoticeIcon className={`h-4 w-4 mt-0.5 ${noticeIconClassName}`} />
          <p className={`text-sm ${noticeIconClassName}`}>{noticeText}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {reasonLabel} <span className="text-destructive">*</span>
          </label>
          <Textarea placeholder={placeholder} value={reason} onChange={e => onReasonChange(e.target.value)} rows={4} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button variant={submitVariant} className={`gap-2 ${submitClassName}`} onClick={onConfirm}>
          <Icon className="h-4 w-4" /> {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

interface ForwardDialogProps {
  comment: string;
  forwardTo: string;
  onCancel: () => void;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  onForwardToChange: (v: string) => void;
  target: PayrollDistRecord | null;
}

const ForwardDialog = ({
  comment,
  forwardTo,
  onCancel,
  onCommentChange,
  onConfirm,
  onForwardToChange,
  target
}: ForwardDialogProps) => (
  <Dialog open={Boolean(target)} onOpenChange={onCancel}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> 轉簽審核
        </DialogTitle>
        <DialogDescription>將 {target?.period} 的發薪批次轉交其他審核人處理</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            轉簽對象 <span className="text-destructive">*</span>
          </label>
          <Select value={forwardTo} onValueChange={onForwardToChange}>
            <SelectTrigger>
              <SelectValue placeholder="選擇審核人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="張經理">張經理（人事部主管）</SelectItem>
              <SelectItem value="林財務">林財務（財務經理）</SelectItem>
              <SelectItem value="陳總監">陳總監（總經理）</SelectItem>
              <SelectItem value="李副總">李副總（副總經理）</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">轉簽說明（選填）</label>
          <Textarea
            placeholder="說明轉簽原因..."
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button className="gap-2" onClick={onConfirm}>
          <Send className="h-4 w-4" /> 確認轉簽
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

interface PreviewStepRowProps {
  isLast: boolean;
  step: ApprovalStep;
}

const PreviewStepRow = ({ isLast, step }: PreviewStepRowProps) => {
  const isCompleted = step.status === 'completed';
  const showTime = step.time && step.time !== '—';
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${stepBadgeClass(step.status)}`}
        >
          {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.level}
        </div>
        {!isLast && <div className={`w-px h-6 ${isCompleted ? 'bg-success' : 'bg-border'}`} />}
      </div>
      <div className="flex-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{step.title}</span>
          {step.status === 'current' && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              當前
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {step.approver} · {step.role}
        </p>
        {step.comment && <p className="text-xs text-muted-foreground mt-0.5">「{step.comment}」</p>}
        {showTime && <p className="text-xs text-muted-foreground">{step.time}</p>}
      </div>
    </div>
  );
};

interface PreviewDialogProps {
  onClose: () => void;
  onViewDetail: () => void;
  target: PayrollDistRecord | null;
}

const PreviewDialog = ({ onClose, onViewDetail, target }: PreviewDialogProps) => {
  if (!target) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }
  const anomalies = mockAnomalies[target.id] || [];
  const steps = getApprovalSteps(target);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target.period} 發薪明細預覽</DialogTitle>
          <DialogDescription>
            批次 {target.id} · {target.employeeCount} 人 · 實發 HK$ {target.totalNet.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 my-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">應發總額</p>
            <p className="font-bold text-foreground">HK$ {target.totalGross.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">扣款總額</p>
            <p className="font-bold text-destructive">- HK$ {target.totalDeduction.toLocaleString()}</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/20">
            <p className="text-xs text-muted-foreground">實發總額</p>
            <p className="font-bold text-primary">HK$ {target.totalNet.toLocaleString()}</p>
          </div>
        </div>

        {anomalies.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-warning" /> 異常項目
            </p>
            {anomalies.map((a, i) => {
              const cfg = severityConfig[a.severity];
              return (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-md border text-sm mb-1 ${cfg.bg}`}>
                  <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground flex-1">{a.description}</span>
                </div>
              );
            })}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>部門</TableHead>
              <TableHead>職位</TableHead>
              <TableHead>銀行</TableHead>
              <TableHead className="text-right">實發金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDistEmployees.map(emp => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                  </div>
                </TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.position}</TableCell>
                <TableCell>{emp.bankName}</TableCell>
                <TableCell className="text-right font-semibold">HK$ {emp.netSalary.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-3">審批流程</p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <PreviewStepRow key={step.level} step={step} isLast={i >= steps.length - 1} />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
          <Button onClick={onViewDetail}>查看完整詳情</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Component ───

export default function PayrollDistApproval() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState(mockDistRecords);
  const [logs] = useState(mockApprovalLogs);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  // Dialogs
  const [approveTarget, setApproveTarget] = useState<PayrollDistRecord | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [rejectTarget, setRejectTarget] = useState<PayrollDistRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [forwardTarget, setForwardTarget] = useState<PayrollDistRecord | null>(null);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardComment, setForwardComment] = useState('');
  const [returnTarget, setReturnTarget] = useState<PayrollDistRecord | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [previewTarget, setPreviewTarget] = useState<PayrollDistRecord | null>(null);
  const [batchApproveOpen, setBatchApproveOpen] = useState(false);
  const [batchComment, setBatchComment] = useState('');
  const [logFilter, setLogFilter] = useState('all');

  const pendingRecords = records.filter(r => r.status === '待審核');
  const reviewedRecords = records.filter(r => ['已審核', '發放中', '已發放'].includes(r.status));

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.batchId.toLowerCase().includes(search.toLowerCase()) || l.operator.includes(search);
    const matchFilter = logFilter === 'all' || l.action === logFilter;
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: '待審核', value: `${pendingRecords.length} 筆`, icon: Clock, color: 'text-warning' },
    { label: '已審核', value: `${reviewedRecords.length} 筆`, icon: CheckCircle, color: 'text-success' },
    {
      label: '待審核金額',
      value: `HK$ ${pendingRecords.reduce((s, r) => s + r.totalNet, 0).toLocaleString()}`,
      icon: Wallet,
      color: 'text-primary'
    },
    {
      label: '異常提醒',
      value: `${pendingRecords.reduce((s, r) => s + (mockAnomalies[r.id]?.filter(a => a.severity !== 'info').length || 0), 0)} 項`,
      icon: AlertTriangle,
      color: 'text-warning'
    }
  ];

  const toggleBatch = (id: string) => {
    setSelectedBatches(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleAllBatches = () => {
    setSelectedBatches(prev => (prev.length === pendingRecords.length ? [] : pendingRecords.map(r => r.id)));
  };

  const handleApprove = () => {
    if (!approveTarget) return;
    setRecords(prev =>
      prev.map(r =>
        r.id === approveTarget.id
          ? { ...r, status: '已審核' as const, approvedBy: '陳總監', updatedAt: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(`${approveTarget.period} 審核已通過（部門主管初審）`);
    setApproveTarget(null);
    setApproveComment('');
  };

  const handleBatchApprove = () => {
    if (selectedBatches.length === 0) return;
    setRecords(prev =>
      prev.map(r =>
        selectedBatches.includes(r.id)
          ? { ...r, status: '已審核' as const, approvedBy: '陳總監', updatedAt: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(`已批量審核通過 ${selectedBatches.length} 筆批次`);
    setSelectedBatches([]);
    setBatchApproveOpen(false);
    setBatchComment('');
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('請填寫駁回原因');
      return;
    }
    setRecords(prev =>
      prev.map(r =>
        r.id === rejectTarget.id
          ? { ...r, status: '草稿' as const, updatedAt: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(`${rejectTarget.period} 已駁回`);
    setRejectTarget(null);
    setRejectReason('');
  };

  const handleReturn = () => {
    if (!returnTarget || !returnReason.trim()) {
      toast.error('請填寫退回原因');
      return;
    }
    setRecords(prev =>
      prev.map(r =>
        r.id === returnTarget.id
          ? { ...r, status: '草稿' as const, updatedAt: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(`${returnTarget.period} 已退回修改`);
    setReturnTarget(null);
    setReturnReason('');
  };

  const handleForward = () => {
    if (!forwardTarget || !forwardTo.trim()) {
      toast.error('請選擇轉簽人');
      return;
    }
    toast.success(`${forwardTarget.period} 已轉簽給 ${forwardTo}`);
    setForwardTarget(null);
    setForwardTo('');
    setForwardComment('');
  };

  // Get previous period for comparison
  const getPrevRecord = (record: PayrollDistRecord) => {
    const idx = records.findIndex(r => r.id === record.id);
    return records[idx + 1] || null;
  };

  const closeApprove = () => {
    setApproveTarget(null);
    setApproveComment('');
  };
  const closeBatch = () => {
    setBatchApproveOpen(false);
    setBatchComment('');
  };
  const closeReject = () => {
    setRejectTarget(null);
    setRejectReason('');
  };
  const closeReturn = () => {
    setReturnTarget(null);
    setReturnReason('');
  };
  const closeForward = () => {
    setForwardTarget(null);
    setForwardTo('');
    setForwardComment('');
  };
  const closePreview = () => setPreviewTarget(null);
  const viewPreviewDetail = () => {
    const id = previewTarget?.id;
    setPreviewTarget(null);
    if (id) navigate(`/payroll/distribute/${id}`);
  };

  const renderDialogs = () => (
    <>
      <ApproveDialog
        target={approveTarget}
        comment={approveComment}
        onCancel={closeApprove}
        onConfirm={handleApprove}
        onCommentChange={setApproveComment}
      />
      <BatchApproveDialog
        open={batchApproveOpen}
        selectedIds={selectedBatches}
        records={records}
        comment={batchComment}
        onCancel={closeBatch}
        onConfirm={handleBatchApprove}
        onCommentChange={setBatchComment}
      />
      <ReasonDialog
        target={rejectTarget}
        title="駁回發薪批次"
        description={`駁回 ${rejectTarget?.period ?? ''} 的發薪批次，批次將終止審核流程`}
        icon={XCircle}
        iconClassName="text-destructive"
        noticeClassName="bg-destructive/5 border-destructive/20"
        noticeIcon={AlertCircle}
        noticeIconClassName="text-destructive"
        noticeText="駁回後批次將終止審核流程並退回草稿，提交者需修改後重新提交。此操作無法復原。"
        reasonLabel="駁回原因"
        placeholder="請詳細說明駁回原因，例如：金額計算有誤、人員名單需更新..."
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={closeReject}
        onConfirm={handleReject}
        submitVariant="destructive"
        submitLabel="確認駁回"
      />
      <ReasonDialog
        target={returnTarget}
        title="退回修改"
        description={`將 ${returnTarget?.period ?? ''} 退回給提交者進行修改`}
        icon={ArrowLeft}
        iconClassName="text-warning"
        noticeClassName="bg-warning/5 border-warning/20"
        noticeIcon={AlertTriangle}
        noticeIconClassName="text-warning"
        noticeText="退回修改後，批次將回到草稿狀態，提交者可修改後重新提交審核。"
        reasonLabel="退回原因"
        placeholder="請說明需要修改的內容，例如：某員工加班時數需確認..."
        reason={returnReason}
        onReasonChange={setReturnReason}
        onCancel={closeReturn}
        onConfirm={handleReturn}
        submitClassName="bg-warning text-warning-foreground hover:bg-warning/90"
        submitLabel="確認退回"
      />
      <ForwardDialog
        target={forwardTarget}
        forwardTo={forwardTo}
        comment={forwardComment}
        onCancel={closeForward}
        onConfirm={handleForward}
        onForwardToChange={setForwardTo}
        onCommentChange={setForwardComment}
      />
      <PreviewDialog target={previewTarget} onClose={closePreview} onViewDetail={viewPreviewDetail} />
    </>
  );

  const renderPending = () => (
    <>
      {pendingRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">沒有待審核的發薪批次</p>
            <p className="text-sm mt-1">所有批次均已處理完畢</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Batch select header */}
          <div className="flex items-center gap-3 px-2">
            <Checkbox
              checked={selectedBatches.length === pendingRecords.length && pendingRecords.length > 0}
              onCheckedChange={toggleAllBatches}
            />
            <span className="text-sm text-muted-foreground">全選待審核批次</span>
          </div>

          {pendingRecords.map(record => {
            const prevRecord = getPrevRecord(record);
            const anomalies = mockAnomalies[record.id] || [];
            const warningCount = anomalies.filter(a => a.severity !== 'info').length;
            const steps = getApprovalSteps(record);
            const currentStep = steps.find(s => s.status === 'current');
            const completedSteps = steps.filter(s => s.status === 'completed').length;

            const netDiff = prevRecord ? record.totalNet - prevRecord.totalNet : 0;
            const netDiffPct = prevRecord ? ((netDiff / prevRecord.totalNet) * 100).toFixed(1) : '0';
            const countDiff = prevRecord ? record.employeeCount - prevRecord.employeeCount : 0;

            return (
              <Card
                key={record.id}
                className={`border-l-4 ${warningCount > 0 ? 'border-l-warning' : 'border-l-primary'}`}
              >
                <CardContent className="p-6">
                  {/* Top row: checkbox + title + status */}
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedBatches.includes(record.id)}
                      onCheckedChange={() => toggleBatch(record.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{record.period}</h3>
                          <Badge variant="outline" className={statusColors[record.status]}>
                            {record.status}
                          </Badge>
                          {warningCount > 0 && (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
                              <AlertTriangle className="h-3 w-3" /> {warningCount} 項異常
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">編號 {record.id}</span>
                      </div>

                      {/* Key info grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">發薪人數</p>
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-foreground">{record.employeeCount} 人</p>
                            {countDiff !== 0 && (
                              <span
                                className={`text-xs flex items-center ${countDiff > 0 ? 'text-success' : 'text-destructive'}`}
                              >
                                {countDiff > 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {Math.abs(countDiff)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">應發總額</p>
                          <p className="font-semibold text-foreground">HK$ {record.totalGross.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">扣款總額</p>
                          <p className="font-semibold text-destructive">
                            - HK$ {record.totalDeduction.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">實發總額</p>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-primary">HK$ {record.totalNet.toLocaleString()}</p>
                            {netDiff !== 0 && (
                              <span
                                className={`text-xs flex items-center ${netDiff > 0 ? 'text-success' : 'text-destructive'}`}
                              >
                                {netDiff > 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {netDiffPct}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">發薪日期</p>
                          <p className="font-semibold text-foreground">{record.payDate}</p>
                        </div>
                      </div>

                      {/* Second row: method, bank, submitter */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">發薪方式</p>
                          <p className="text-sm text-foreground">{record.payMethod}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">銀行名稱</p>
                          <p className="text-sm text-foreground">{record.bankName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">提交者</p>
                          <p className="text-sm text-foreground">{record.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">備註</p>
                          <p className="text-sm text-foreground">{record.note || '—'}</p>
                        </div>
                      </div>

                      {/* Approval progress */}
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">審批進度</span>
                          <span className="text-xs text-muted-foreground">
                            當前節點：{currentStep?.title || '—'} ·{' '}
                            {currentStep?.approver !== '—' ? currentStep?.approver : '待指派'}
                          </span>
                        </div>
                        <Progress value={(completedSteps / steps.length) * 100} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {steps.map(step => (
                            <div
                              key={step.level}
                              className={`flex items-center gap-1 ${({ completed: 'text-success', current: 'text-primary font-medium' } as Record<string, string>)[step.status] ?? ''}`}
                            >
                              {step.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                              {step.status === 'current' && <Clock className="h-3 w-3" />}
                              {step.status !== 'completed' && step.status !== 'current' && (
                                <span className="h-3 w-3 rounded-full border border-border inline-block" />
                              )}
                              {step.title}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Anomaly alerts */}
                      {anomalies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-warning" /> 異常項目提醒
                          </p>
                          <div className="space-y-1.5">
                            {anomalies.map((a, i) => {
                              const cfg = severityConfig[a.severity];
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 p-2 rounded-md border text-sm ${cfg.bg}`}
                                >
                                  <cfg.icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                                  <div className="flex-1">
                                    <span className="font-medium">{a.name}</span>
                                    <span className="text-muted-foreground mx-1">·</span>
                                    <span className="text-muted-foreground">{a.department}</span>
                                    <span className="text-muted-foreground mx-1">·</span>
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {a.type}
                                    </Badge>
                                    <p className="mt-0.5 text-muted-foreground">{a.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreviewTarget(record)}>
                      <Eye className="h-4 w-4" /> 查看明細
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReturnTarget(record)}>
                        <ArrowLeft className="h-4 w-4" /> 退回修改
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setForwardTarget(record)}>
                        <Send className="h-4 w-4" /> 轉簽
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => setRejectTarget(record)}
                      >
                        <XCircle className="h-4 w-4" /> 駁回
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => setApproveTarget(record)}
                      >
                        <CheckCircle className="h-4 w-4" /> 審核通過
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );

  const renderHistory = () => (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">審核歷史記錄</CardTitle>
            <div className="flex gap-2">
              <Select value={logFilter} onValueChange={setLogFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="操作類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="提交審核">提交審核</SelectItem>
                  <SelectItem value="初審通過">初審通過</SelectItem>
                  <SelectItem value="複審通過">複審通過</SelectItem>
                  <SelectItem value="終審通過">終審通過</SelectItem>
                  <SelectItem value="審核駁回">審核駁回</SelectItem>
                  <SelectItem value="執行發放">執行發放</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋批次或操作人..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時間</TableHead>
                <TableHead>批次編號</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>備註</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                  <TableCell
                    className="font-medium text-primary cursor-pointer"
                    onClick={() => navigate(`/payroll/distribute/${log.batchId}`)}
                  >
                    {log.batchId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={actionColors[log.action] || ''}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.operator}</TableCell>
                  <TableCell className="text-muted-foreground">{log.role}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[260px] truncate">{log.comment}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    沒有符合條件的記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/distribute')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">發薪審核</h1>
            <p className="text-muted-foreground mt-1">多級審核薪資發放批次，確保合規與準確</p>
          </div>
        </div>
        {selectedBatches.length > 0 && (
          <Button className="gap-2" onClick={() => setBatchApproveOpen(true)}>
            <CheckCheck className="h-4 w-4" /> 批量審核 ({selectedBatches.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> 待我審核
            {pendingRecords.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {pendingRecords.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> 審核記錄
          </TabsTrigger>
        </TabsList>

        {/* ─── Pending Tab ─── */}
        <TabsContent value="pending">{renderPending()}</TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history">{renderHistory()}</TabsContent>
      </Tabs>

      {renderDialogs()}
    </div>
  );
}
