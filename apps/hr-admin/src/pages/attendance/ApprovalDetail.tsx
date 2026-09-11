import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  User,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ACTION_TEXT,
  type Approval,
  APPROVAL_TYPE_TEXT,
  approveApproval,
  getApprovalById,
  rejectApproval,
  transferApproval,
  withdrawApproval
} from '@/api/approval';
import { type EmployeeOption, getActiveEmployeeOptions } from '@/api/employee';
import { getLeaveTypes } from '@/api/leaveSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { APPROVAL_PERM } from '@/lib/perms';

/** 请假审批(type=1)的 subType 存的是假别 code，需映射回名称 */
const LEAVE_TYPE = 1;

/** 单据状态码 → 展示配置 */
const statusConfig: Record<number, { color: string; icon: React.ElementType; label: string }> = {
  1: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: '待審核' },
  2: { color: 'bg-primary/10 text-primary border-primary/20', icon: Clock, label: '審批中' },
  3: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, label: '已通過' },
  4: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle, label: '已駁回' },
  5: { color: 'bg-muted text-muted-foreground', icon: RotateCcw, label: '已撤回' }
};

const typeIcons: Record<number, React.ElementType> = {
  1: CalendarDays,
  2: DollarSign,
  3: Clock,
  4: MapPin,
  5: FileText,
  7: ClipboardCheck
};

/** Payload 字段的中文名；未命中则显示原始键（键名须与手机端申请表单提交的 payload 对齐） */
const PAYLOAD_LABELS: Record<string, string> = {
  days: '天數',
  hours: '時數',
  amount: '金額',
  currency: '幣別',
  startDate: '開始日期',
  endDate: '結束日期',
  date: '日期',
  startTime: '開始時間',
  endTime: '結束時間',
  clockInTime: '上班補卡時間',
  clockOutTime: '下班補卡時間',
  missReason: '漏打原因',
  witness: '見證同事',
  half: '時段',
  reason: '事由',
  contact: '緊急聯絡',
  compensation: '補償方式',
  invoiceNo: '發票號碼',
  payee: '收款人/店家',
  country: '國家/地區',
  city: '城市',
  transport: '交通方式',
  budget: '預估費用',
  companions: '同行人員',
  resignDate: '預計離職日',
  resignReason: '離職原因',
  handover: '交接對象',
  feedback: '建議回饋',
  destination: '目的地',
  category: '類別',
  remark: '備註'
};

/** 表单存的是码值，展示要换回中文 */
const PAYLOAD_VALUE_TEXT: Record<string, Record<string, string>> = {
  half: { full: '全天', am: '上午半天', pm: '下午半天' },
  compensation: { pay: '加班費', leave: '折換補休' }
};

/** 仅供后续流程取用的内部字段，不展示给审批人（同名的展示字段已另行渲染） */
const HIDDEN_PAYLOAD_KEYS = ['handoverId'];

/** Payload 值的展示文案：码值翻中文，天数/时数补单位 */
const formatPayloadValue = (key: string, value: unknown) => {
  const mapped = PAYLOAD_VALUE_TEXT[key]?.[String(value)];
  if (mapped) return mapped;
  if (key === 'days') return `${value} 天`;
  if (key === 'hours') return `${value} 小時`;
  return String(value);
};

/** 审批节点 → 时间轴步骤状态 */
type StepStatus = 'completed' | 'current' | 'pending' | 'rejected';
const nodeStepStatus = (node: { current?: boolean; statusCode: number }): StepStatus => {
  if (node.statusCode === 2) return 'completed';
  if (node.statusCode === 3) return 'rejected';
  if (node.current) return 'current';
  return 'pending';
};
const stepCircleStyle: Record<StepStatus, string> = {
  completed: 'border-success bg-success text-success-foreground',
  current: 'border-warning bg-warning text-warning-foreground animate-pulse',
  pending: 'border-border bg-muted text-muted-foreground',
  rejected: 'border-destructive bg-destructive text-destructive-foreground'
};
const stepLineStyle: Record<StepStatus, string> = {
  completed: 'bg-success',
  current: 'bg-warning',
  pending: 'bg-border',
  rejected: 'bg-destructive'
};
const stepBadgeStyle: Record<StepStatus, string> = {
  completed: 'bg-success/10 text-success border-success/20',
  current: 'bg-warning/10 text-warning border-warning/20',
  pending: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20'
};

type ActionType = 'approve' | 'reject' | 'transfer' | 'withdraw' | null;

export default function ApprovalDetail() {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionDialog, setActionDialog] = useState<ActionType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [leaveTypeMap, setLeaveTypeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getActiveEmployeeOptions()
      .then(res => setEmployees(res.data ?? []))
      .catch(() => setEmployees([]));
    getLeaveTypes()
      .then(res => {
        const map: Record<string, string> = {};
        (res.data ?? []).forEach(lt => {
          map[lt.code] = lt.name;
        });
        setLeaveTypeMap(map);
      })
      .catch(() => setLeaveTypeMap({}));
  }, []);

  const load = useCallback(() => {
    if (!approvalId) return;
    setLoading(true);
    getApprovalById(Number(approvalId))
      .then(res => setData(res.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [approvalId]);
  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">載入中...</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該審批記錄</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/attendance/approval')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回審批管理
        </Button>
      </div>
    );
  }

  const sc = statusConfig[data.statusCode] ?? statusConfig[1];
  const StatusIcon = sc.icon;
  const TypeIcon = typeIcons[data.type] || FileText;
  const typeText = APPROVAL_TYPE_TEXT[data.type] ?? data.typeName ?? '';
  const nodes = data.nodes ?? [];
  const history = data.history ?? [];
  // 空值不占位，否则详情页会出现只有标签没有内容的格子
  const payloadEntries = Object.entries(data.payload ?? {}).filter(
    ([k, v]) => v !== null && v !== undefined && v !== '' && !HIDDEN_PAYLOAD_KEYS.includes(k)
  );

  const runAction = async () => {
    if (!actionDialog) return;
    if (actionDialog === 'transfer' && !transferTo) {
      toast.error('請選擇轉簽對象');
      return;
    }
    setSubmitting(true);
    try {
      const text = comment.trim() || undefined;
      if (actionDialog === 'approve') {
        await approveApproval(data.id, text);
        toast.success(`已核准申請 ${data.code}`);
      } else if (actionDialog === 'reject') {
        await rejectApproval(data.id, text);
        toast.success(`已駁回申請 ${data.code}`);
      } else if (actionDialog === 'transfer') {
        await transferApproval(data.id, Number(transferTo), text);
        toast.success('已轉簽');
      } else {
        await withdrawApproval(data.id);
        toast.success(`已撤回申請 ${data.code}`);
      }
      setActionDialog(null);
      setComment('');
      setTransferTo('');
      load();
    } catch (err: any) {
      toast.error(err.message || '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  type ActionConfig = {
    btnClass: string;
    btnLabel: string;
    desc: string;
    icon: React.ElementType;
    iconClass: string;
    target?: { label: string; className: string };
    title: string;
  };
  const actionConfigs: Record<string, ActionConfig> = {
    approve: {
      title: '確認核准',
      desc: `確定要核准 ${data.applicantName} 的${typeText}嗎？`,
      btnLabel: '確認核准',
      btnClass: 'bg-success hover:bg-success/90 text-success-foreground',
      icon: CheckCircle2,
      iconClass: 'text-success',
      target: { label: '已通過', className: 'bg-success/10 text-success border-success/20' }
    },
    reject: {
      title: '確認駁回',
      desc: `確定要駁回 ${data.applicantName} 的${typeText}嗎？駁回後申請流程將終止。`,
      btnLabel: '確認駁回',
      btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
      icon: XCircle,
      iconClass: 'text-destructive',
      target: { label: '已駁回', className: 'bg-destructive/10 text-destructive border-destructive/20' }
    },
    transfer: {
      title: '轉簽審批',
      desc: '將此節點轉交給其他人處理，審批層級不變。',
      btnLabel: '確認轉簽',
      btnClass: '',
      icon: Send,
      iconClass: 'text-primary'
    },
    withdraw: {
      title: '確認撤回',
      desc: `確定要撤回申請 ${data.code}？撤回後需重新提交。`,
      btnLabel: '確認撤回',
      btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
      icon: RotateCcw,
      iconClass: 'text-destructive',
      target: { label: '已撤回', className: 'bg-muted text-muted-foreground' }
    }
  };

  const canApprove = data.canApprove;
  const showActions = canApprove && (hasPerm(APPROVAL_PERM.APPROVE) || hasPerm(APPROVAL_PERM.REJECT));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/attendance/approval')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-primary" />
              {typeText}詳情
              <span className="text-lg font-mono text-muted-foreground">{data.code}</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">提交於 {data.submittedAt}</p>
          </div>
        </div>
        <Badge className={`${sc.color} border text-sm px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {sc.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TypeIcon className="h-4 w-4 text-primary" />
                {typeText}資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">申請人</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {data.applicantName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">部門</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {data.departmentName || '—'}
                  </p>
                </div>
                {data.subType && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">子類型</p>
                    <Badge variant="outline">
                      {data.type === LEAVE_TYPE ? (leaveTypeMap[data.subType] ?? data.subType) : data.subType}
                    </Badge>
                  </div>
                )}
                {payloadEntries.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground mb-1">{PAYLOAD_LABELS[k] ?? k}</p>
                    <p className="text-sm font-medium text-foreground">{formatPayloadValue(k, v)}</p>
                  </div>
                ))}
              </div>

              {data.summary && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">申請摘要</p>
                    <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
                  </div>
                </>
              )}

              {(data.attachments?.length ?? 0) > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">附件</p>
                    <div className="space-y-1">
                      {data.attachments!.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {url.split('/').pop() || url}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 审批操作 */}
          {showActions && (
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
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {hasPerm(APPROVAL_PERM.APPROVE) && (
                    <Button
                      onClick={() => setActionDialog('approve')}
                      className="bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      核准
                    </Button>
                  )}
                  {hasPerm(APPROVAL_PERM.REJECT) && (
                    <Button variant="destructive" onClick={() => setActionDialog('reject')}>
                      <XCircle className="h-4 w-4 mr-1" />
                      駁回
                    </Button>
                  )}
                  {hasPerm(APPROVAL_PERM.APPROVE) && (
                    <Button variant="outline" onClick={() => setActionDialog('transfer')}>
                      <Send className="h-4 w-4 mr-1" />
                      轉簽
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {canApprove && !showActions && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground text-center">當前節點不需要您審批</p>
              </CardContent>
            </Card>
          )}

          {data.canWithdraw && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setActionDialog('withdraw')}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                撤回申請
              </Button>
            </div>
          )}
        </div>

        {/* Right: approval timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                審批流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">無審批節點</p>
              ) : (
                <div className="relative">
                  {nodes.map((node, index) => {
                    const st = nodeStepStatus(node);
                    const isLast = index === nodes.length - 1;
                    const StepIcon =
                      st === 'completed'
                        ? CheckCircle2
                        : st === 'rejected'
                          ? XCircle
                          : st === 'current'
                            ? Clock
                            : FileText;
                    return (
                      <div key={node.id} className="relative flex gap-3">
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] ${stepLineStyle[st]}`}
                          />
                        )}
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${stepCircleStyle[st]}`}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
                          <p className="text-sm font-medium text-foreground">
                            第 {node.levelNo} 級 · {node.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">審批人：{node.approverName || '—'}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-xs ${stepBadgeStyle[st]}`}>
                              {node.status}
                            </Badge>
                            {node.current && (
                              <Badge className="text-xs bg-warning/10 text-warning border-warning/20 border">
                                當前
                              </Badge>
                            )}
                          </div>
                          {node.approvedAt && <p className="text-xs text-muted-foreground mt-1">{node.approvedAt}</p>}
                          {node.comment && (
                            <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border">
                              <p className="text-xs text-foreground leading-relaxed">意見：{node.comment}</p>
                            </div>
                          )}
                          {st === 'current' && !node.approvedAt && (
                            <p className="text-xs text-warning mt-1 font-medium">等待審批中...</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作纪录 */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  操作紀錄
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="text-sm py-1.5 border-b last:border-b-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {h.actionName ?? ACTION_TEXT[h.action]}
                          </Badge>
                          <span className="text-foreground truncate">{h.approverName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{h.createdAt}</span>
                      </div>
                      {h.comment && <p className="text-xs text-muted-foreground mt-1">— {h.comment}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={Boolean(actionDialog)} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          {actionDialog &&
            (() => {
              const cfg = actionConfigs[actionDialog];
              const DialogIcon = cfg.icon;
              const curStatus = statusConfig[data.statusCode];
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <DialogIcon className={`h-5 w-5 ${cfg.iconClass}`} />
                      {cfg.title}
                    </DialogTitle>
                    <DialogDescription>{cfg.desc}</DialogDescription>
                  </DialogHeader>

                  {/* 单据摘要卡片 */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{data.code}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {typeText}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {data.applicantName}
                      {data.summary ? ` — ${data.summary}` : ''}
                    </p>
                  </div>

                  {actionDialog === 'transfer' && (
                    <div className="space-y-2">
                      <Label>
                        轉簽對象 <span className="text-destructive">*</span>
                      </Label>
                      <Select value={transferTo} onValueChange={setTransferTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇要轉交的人員" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees
                            .filter(e => e.id !== data.applicantId)
                            .map(e => (
                              <SelectItem key={e.id} value={String(e.id)}>
                                {e.name}
                                {e.employeeNo ? `（${e.employeeNo}）` : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {actionDialog !== 'withdraw' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">備註（選填）</Label>
                      <Textarea
                        placeholder={actionDialog === 'transfer' ? '轉簽說明...' : '請輸入備註...'}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* 状态流转预览 */}
                  {cfg.target && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-2">狀態流轉預覽</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={curStatus?.color || ''}>
                          {curStatus?.label || data.status || '待審核'}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Badge variant="secondary" className={cfg.target.className}>
                          {cfg.target.label}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActionDialog(null)}>
                      取消
                    </Button>
                    <Button className={cfg.btnClass} onClick={runAction} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {cfg.btnLabel}
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
