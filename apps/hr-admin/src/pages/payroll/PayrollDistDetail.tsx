import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getActiveEmployeeOptions } from '@/api/employee';
import {
  APPROVAL_LEVEL_TITLES,
  approveDist,
  DIST_STATUS_TEXT,
  type DistItem,
  type DistStatus,
  executeDist,
  getDistBatchDetail,
  getDistLevels,
  getPendingDistBatches,
  PAY_STATUS_TEXT,
  type PayStatus,
  reassignDist,
  rejectDist,
  submitDist
} from '@/api/payrollDist';
import { ApproveConfirmDialog, ReassignDialog } from '@/components/payroll/PayrollApproveDialogs';
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { PAYROLL_PERM } from '@/lib/perms';

const statusColors: Record<DistStatus, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-warning/10 text-warning border-warning/20',
  3: 'bg-accent/10 text-accent-foreground border-accent/20',
  4: 'bg-primary/10 text-primary border-primary/20',
  5: 'bg-success/10 text-success border-success/20',
  6: 'bg-destructive/10 text-destructive border-destructive/20'
};
const payColors: Record<PayStatus, string> = {
  1: 'bg-warning/10 text-warning border-warning/20',
  2: 'bg-success/10 text-success border-success/20',
  3: 'bg-destructive/10 text-destructive border-destructive/20',
  4: 'bg-muted text-muted-foreground border-border'
};
const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();

export default function PayrollDistDetail() {
  const { t } = useTranslation();
  const { distId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const batchId = Number(distId);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DistItem | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [reassignComment, setReassignComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['distBatchDetail', batchId],
    queryFn: async () => (await getDistBatchDetail(batchId)).data,
    enabled: Boolean(batchId)
  });
  const { data: levelTitles = APPROVAL_LEVEL_TITLES } = useQuery({
    queryKey: ['distLevels'],
    queryFn: async () => (await getDistLevels()).data ?? APPROVAL_LEVEL_TITLES
  });
  // 待我審核批次(已按當前級審批人過濾)——用來判斷本批當前登錄人是否可審
  const { data: myPending = [] } = useQuery({
    queryKey: ['pendingDist'],
    queryFn: async () => (await getPendingDistBatches()).data ?? []
  });
  const { data: activeEmployees = [] } = useQuery({
    queryKey: ['activeEmployees'],
    queryFn: async () => (await getActiveEmployeeOptions()).data ?? []
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['distBatchDetail', batchId] });
    queryClient.invalidateQueries({ queryKey: ['distBatches'] });
    queryClient.invalidateQueries({ queryKey: ['pendingDist'] });
  };
  const submitM = useMutation({
    mutationFn: () => submitDist(batchId),
    onSuccess: () => {
      toast.success(t('已提交審核'));
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || t('操作失敗'))
  });
  const executeM = useMutation({
    mutationFn: () => executeDist(batchId),
    onSuccess: () => {
      toast.success(t('薪資已發放'));
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || t('操作失敗'))
  });
  const approveM = useMutation({
    mutationFn: () => approveDist(batchId, approveComment),
    onSuccess: () => {
      toast.success(t('已審核通過'));
      setApproveOpen(false);
      setApproveComment('');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || t('操作失敗'))
  });
  const rejectM = useMutation({
    mutationFn: () => rejectDist(batchId, rejectReason),
    onSuccess: () => {
      toast.success(t('已駁回'));
      setRejectOpen(false);
      setRejectReason('');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || t('操作失敗'))
  });
  const reassignM = useMutation({
    mutationFn: () => reassignDist(batchId, Number(reassignTo), reassignComment),
    onSuccess: () => {
      toast.success(t('已轉簽'));
      setReassignOpen(false);
      setReassignTo('');
      setReassignComment('');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || t('操作失敗'))
  });

  if (isLoading || !data?.batch) return <div className="p-6 text-center text-muted-foreground">{t('載入中…')}</div>;

  const record = data.batch;
  const items = data.items;
  const logs = data.logs;
  const anomalies = data.anomalies;
  const totalLevels = data.totalLevels ?? levelTitles.length;

  const filtered = items.filter(
    e =>
      (e.employeeName || '').includes(search) ||
      (e.employeeNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.departmentName || '').includes(search)
  );

  const canSubmit = record.status === 1;
  // 僅「當前級合法審批人」可審(與發薪審核頁口徑一致)；無權者不顯示按鈕
  const canApprove = record.status === 2 && myPending.some(b => b.id === batchId);
  const canExecute = record.status === 3;

  const summaryCards = [
    { label: '應發總額', value: `HK$ ${num(record.totalGross)}`, icon: TrendingUp, color: 'text-success' },
    { label: '扣款總額', value: `HK$ ${num(record.totalDeduction)}`, icon: TrendingDown, color: 'text-destructive' },
    { label: '實發總額', value: `HK$ ${num(record.totalNet)}`, icon: Wallet, color: 'text-primary' },
    {
      label: '公司承擔',
      value: `HK$ ${num(record.totalEmployerContribution)}`,
      icon: DollarSign,
      color: 'text-accent-foreground'
    },
    {
      label: '發薪人數',
      value: t('{{n}} 人', { n: record.employeeCount }),
      icon: Users,
      color: 'text-accent-foreground'
    }
  ];

  // 審批步驟：由 approvalLevel 推導完成度
  const steps = levelTitles.slice(0, totalLevels).map((title, i) => ({
    level: i + 1,
    title,
    done: (record.approvalLevel ?? 0) >= i + 1,
    current: record.status === 2 && (record.approvalLevel ?? 0) === i
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/distribute')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {t('{{period}} 發薪管理', { period: record.period })}
              </h1>
              <Badge variant="outline" className={statusColors[record.status]}>
                {t(DIST_STATUS_TEXT[record.status])}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {t('批次 #{{id}} · 建立者 {{creator}} · 發薪日 {{date}}', {
                id: record.id,
                creator: record.createUserName ?? '—',
                date: record.payDate ?? '—'
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && hasPerm(PAYROLL_PERM.DIST_GENERATE) && (
            <Button className="gap-2" onClick={() => submitM.mutate()}>
              <Send className="h-4 w-4" /> {t('提交審核')}
            </Button>
          )}
          {canApprove && (
            <>
              {hasPerm(PAYROLL_PERM.DIST_REJECT) && (
                <Button
                  variant="outline"
                  className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => setRejectOpen(true)}
                >
                  <XCircle className="h-4 w-4" /> {t('駁回')}
                </Button>
              )}
              {hasPerm(PAYROLL_PERM.DIST_APPROVE) && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setReassignOpen(true);
                    setReassignTo('');
                    setReassignComment('');
                  }}
                >
                  <Send className="h-4 w-4" /> {t('轉簽')}
                </Button>
              )}
              {hasPerm(PAYROLL_PERM.DIST_APPROVE) && (
                <Button
                  className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => setApproveOpen(true)}
                >
                  <CheckCircle className="h-4 w-4" /> {t('審核通過')}
                </Button>
              )}
            </>
          )}
          {canExecute && hasPerm(PAYROLL_PERM.DIST_EXECUTE) && (
            <Button
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => executeM.mutate()}
            >
              <DollarSign className="h-4 w-4" /> {t('執行發放')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{t(s.label)}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {anomalies.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-warning">{t('{{n}} 項異動提醒', { n: anomalies.length })}</span>
            <span className="text-muted-foreground"> {t('— 詳見「批次資訊」頁的異動檢測。')}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">{t('發薪明細')}</TabsTrigger>
          <TabsTrigger value="info">{t('批次資訊')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('審批流程')}</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t('員工發薪明細')}</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('搜尋員工...')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('員工')}</TableHead>
                        <TableHead>{t('支付方式')}</TableHead>
                        <TableHead>{t('銀行 / 帳號')}</TableHead>
                        <TableHead className="text-right">{t('實發金額')}</TableHead>
                        <TableHead>{t('狀態')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(emp => (
                        <TableRow
                          key={emp.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selected?.id === emp.id ? 'bg-primary/5' : ''}`}
                          onClick={() => setSelected(emp)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{emp.employeeNo}</p>
                            </div>
                          </TableCell>
                          <TableCell>{emp.paymentType ?? '—'}</TableCell>
                          <TableCell>
                            <div className="text-sm">{emp.bankName ?? '—'}</div>
                            <div className="font-mono text-xs text-muted-foreground">{emp.bankAccount ?? '—'}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{num(emp.netSalary)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={payColors[emp.payStatus]}>
                              {t(PAY_STATUS_TEXT[emp.payStatus])}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div>
              {selected ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t('發薪詳情')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selected.employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {selected.employeeNo} · {selected.position}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {t('部門')}
                        </span>
                        <span className="font-medium">{selected.departmentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> {t('支付方式')}
                        </span>
                        <span className="font-medium">{selected.paymentType ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> {t('銀行')}
                        </span>
                        <span className="font-medium">{selected.bankName ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> {t('帳號')}
                        </span>
                        <span className="font-medium font-mono">{selected.bankAccount ?? '—'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('發放狀態')}</span>
                        <Badge variant="outline" className={payColors[selected.payStatus]}>
                          {t(PAY_STATUS_TEXT[selected.payStatus])}
                        </Badge>
                      </div>
                      {selected.payStatus === 2 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {t('發放時間')}
                            </span>
                            <span className="font-medium">{selected.payTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> {t('交易編號')}
                            </span>
                            <span className="font-medium text-xs font-mono">{selected.transactionId}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Separator />
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{t('實發金額')}</span>
                        <span className="text-2xl font-bold text-primary">HK$ {num(selected.netSalary)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground">{t('公司承擔（僱主供款）')}</span>
                      <span className="font-medium text-accent-foreground">
                        HK$ {num(selected.employerContribution)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>{t('點擊左側員工查看發薪詳情')}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('基本資訊')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: '薪資期間', value: record.period },
                  { label: '發薪日期', value: record.payDate ?? '—' },
                  { label: '發放群組', value: record.payrollGroup },
                  { label: '主要支付方式', value: record.payMethod ? t(record.payMethod) : '—' },
                  { label: '建立者', value: record.createUserName ?? '—' },
                  { label: '終審人', value: record.approvedByName ?? '—' },
                  { label: '備註', value: record.note ?? '—' }
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t(item.label)}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('異動檢測')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {anomalies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('本批次無環比異動。')}</p>
                ) : (
                  anomalies.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-md border text-sm ${a.severity === 'warning' ? 'bg-warning/10 border-warning/20' : 'bg-primary/10 border-primary/20'}`}
                    >
                      {a.severity === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-muted-foreground">{a.department}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0 ml-1">
                          {t(a.type)}
                        </Badge>
                        <p className="mt-0.5 text-muted-foreground">{a.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('審批進度')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={step.level} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step.done ? 'bg-success text-success-foreground' : step.current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                          {step.done ? <CheckCircle className="h-4 w-4" /> : step.level}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`w-0.5 h-12 ${step.done ? 'bg-success/30' : 'bg-border'}`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`font-semibold ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {t(step.title)}
                        </p>
                        {step.current && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 text-xs mt-1"
                          >
                            {t('當前節點')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('審批日誌')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('時間')}</TableHead>
                      <TableHead>{t('操作')}</TableHead>
                      <TableHead>{t('操作人')}</TableHead>
                      <TableHead>{t('備註')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                          {l.time?.slice(0, 16)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {t(l.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {l.operator}
                          <span className="text-xs text-muted-foreground block">{t(l.role)}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">
                          {l.comment ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {t('尚無審批記錄')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ApproveConfirmDialog
        open={approveOpen}
        onOpenChange={o => {
          if (!o) {
            setApproveOpen(false);
            setApproveComment('');
          }
        }}
        batch={record}
        levelTitle={levelTitles[Math.min(record.approvalLevel ?? 0, totalLevels - 1)]}
        hasAnomaly={anomalies.length > 0}
        comment={approveComment}
        onCommentChange={setApproveComment}
        onConfirm={() => approveM.mutate()}
        loading={approveM.isPending}
      />

      <ReassignDialog
        open={reassignOpen}
        onOpenChange={o => {
          if (!o) {
            setReassignOpen(false);
            setReassignTo('');
            setReassignComment('');
          }
        }}
        batch={record}
        levelTitle={levelTitles[Math.min(record.approvalLevel ?? 0, totalLevels - 1)]}
        employees={activeEmployees}
        targetId={reassignTo}
        onTargetChange={setReassignTo}
        comment={reassignComment}
        onCommentChange={setReassignComment}
        onConfirm={() => {
          if (!reassignTo) {
            toast.error('請選擇轉簽對象');
            return;
          }
          reassignM.mutate();
        }}
        loading={reassignM.isPending}
      />

      <Dialog
        open={rejectOpen}
        onOpenChange={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> {t('駁回發薪批次')}
            </DialogTitle>
            <DialogDescription>
              {t('駁回 {{period}} 的發薪批次，批次將退回草稿狀態', { period: record.period })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{t('駁回後批次退回草稿，提交者需修改後重新提交審核。')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('駁回原因')} <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder={t('請說明駁回原因...')}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason('');
              }}
            >
              {t('取消')}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error(t('請填寫駁回原因'));
                  return;
                }
                rejectM.mutate();
              }}
            >
              <XCircle className="h-4 w-4" /> {t('確認駁回')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
