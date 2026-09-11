import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Download,
  Loader2,
  PiggyBank,
  RefreshCw,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Wallet
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CALC_STATUS_TEXT,
  type CalcBatchStatus,
  type CalcItem,
  calculatePayroll,
  confirmCalcBatch,
  exportCalcBatch,
  getCalcBatchDetail
} from '@/api/payrollCalc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPerm } from '@/lib/auth';
import { PAYROLL_PERM } from '@/lib/perms';
import { salaryTypeLabel } from '@/lib/salaryType';

const statusColors: Record<CalcBatchStatus, string> = {
  1: 'bg-accent/10 text-accent-foreground border-accent/20',
  2: 'bg-success/10 text-success border-success/20',
  3: 'bg-primary/10 text-primary border-primary/20'
};

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();

function groupByDepartment(items: CalcItem[]): Map<string, CalcItem[]> {
  const map = new Map<string, CalcItem[]>();
  items.forEach(it => {
    const dept = it.departmentName || '未分配部門';
    if (!map.has(dept)) map.set(dept, []);
    map.get(dept)!.push(it);
  });
  return map;
}

function DepartmentSection({
  department,
  emps,
  onSelect,
  selectedId
}: {
  department: string;
  emps: CalcItem[];
  onSelect: (it: CalcItem) => void;
  selectedId: number | null;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const totalBase = emps.reduce((s, e) => s + e.baseSalary, 0);
  const totalAllowance = emps.reduce((s, e) => s + e.allowanceTotal, 0);
  const totalDeduction = emps.reduce((s, e) => s + e.totalDeduction, 0);
  const totalNet = emps.reduce((s, e) => s + e.netSalary, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {department === '未分配部門' ? t('未分配部門') : department}
                </CardTitle>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                  {t('{{n}} 人', { n: emps.length })}
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('基本薪資')}</p>
                  <p className="font-semibold">{num(totalBase)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('津貼')}</p>
                  <p className="font-semibold text-success">{num(totalAllowance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('扣款')}</p>
                  <p className="font-semibold text-destructive">{num(totalDeduction)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('實發')}</p>
                  <p className="font-bold text-primary text-base">{num(totalNet)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>{t('員工')}</TableHead>
                  <TableHead>{t('職位')}</TableHead>
                  <TableHead className="text-right">{t('基本薪資')}</TableHead>
                  <TableHead className="text-right">{t('津貼')}</TableHead>
                  <TableHead className="text-right">{t('獎金')}</TableHead>
                  <TableHead className="text-right">{t('扣款')}</TableHead>
                  <TableHead className="text-right">{t('實發')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emps.map(emp => (
                  <TableRow
                    key={emp.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedId === emp.id ? 'bg-primary/5' : ''}`}
                    onClick={() => onSelect(emp)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-1">
                            {emp.employeeName}
                            {emp.salaryType !== 'MONTHLY' && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                              >
                                {t(salaryTypeLabel(emp.salaryType))}
                              </Badge>
                            )}
                            {emp.warnings.length > 0 && <AlertTriangle className="h-3 w-3 text-warning shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{emp.employeeNo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.position}</TableCell>
                    <TableCell className="text-right text-sm">{num(emp.baseSalary)}</TableCell>
                    <TableCell className="text-right text-sm">{num(emp.allowanceTotal)}</TableCell>
                    <TableCell className="text-right text-sm">{num(emp.bonusTotal)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{num(emp.totalDeduction)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(emp.netSalary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function PayrollCalcDetail() {
  const { t } = useTranslation();
  const { calcId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const batchId = Number(calcId);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CalcItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['calcBatchDetail', batchId],
    queryFn: async () => (await getCalcBatchDetail(batchId)).data,
    enabled: Boolean(batchId)
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmCalcBatch(batchId),
    onSuccess: () => {
      toast.success(t('薪資已確認並提交，本月獎懲已計入'));
      queryClient.invalidateQueries({ queryKey: ['calcBatchDetail', batchId] });
      queryClient.invalidateQueries({ queryKey: ['calcBatches'] });
      setConfirmOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || t('確認失敗'))
  });

  const recalcMutation = useMutation({
    mutationFn: (period: string) => calculatePayroll(period),
    onSuccess: () => {
      toast.success(t('已重新計算'));
      queryClient.invalidateQueries({ queryKey: ['calcBatchDetail', batchId] });
      queryClient.invalidateQueries({ queryKey: ['calcBatches'] });
      setRecalcOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || t('重新計算失敗'))
  });

  const handleExport = async () => {
    if (!batch) return;
    setExporting(true);
    try {
      const res = await exportCalcBatch(batchId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${t('薪資核算')}_${batch.period}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('匯出成功'));
    } catch {
      toast.error(t('匯出失敗'));
    } finally {
      setExporting(false);
    }
  };

  const batch = data?.batch;
  const items = data?.items ?? [];

  const filtered = useMemo(
    () =>
      items.filter(
        e =>
          (e.employeeName || '').includes(search) ||
          (e.employeeNo || '').toLowerCase().includes(search.toLowerCase()) ||
          (e.departmentName || '').includes(search)
      ),
    [items, search]
  );

  const departmentGroups = groupByDepartment(filtered);

  if (isLoading || !batch) {
    return <div className="p-6 text-center text-muted-foreground">{t('載入中…')}</div>;
  }

  const summaryCards = [
    { label: '基本薪資合計', value: `HK$ ${num(batch.totalBase)}`, icon: DollarSign, color: 'text-primary' },
    { label: '津貼合計', value: `HK$ ${num(batch.totalAllowance)}`, icon: TrendingUp, color: 'text-success' },
    { label: '獎金合計', value: `HK$ ${num(batch.totalBonus)}`, icon: Calculator, color: 'text-accent-foreground' },
    { label: '扣款合計', value: `HK$ ${num(batch.totalDeduction)}`, icon: TrendingDown, color: 'text-destructive' },
    { label: '實發合計', value: `HK$ ${num(batch.totalNet)}`, icon: Wallet, color: 'text-primary' },
    {
      label: '公司承擔（僱主供款）',
      value: `HK$ ${num(batch.totalEmployerContribution)}`,
      icon: PiggyBank,
      color: 'text-accent-foreground'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/calculate')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {t('{{period}} 薪資計算', { period: batch.period })}
              </h1>
              <Badge variant="outline" className={statusColors[batch.status]}>
                {t(CALC_STATUS_TEXT[batch.status])}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {t('批次 #{{id}} · {{count}} 人 · 更新於 {{date}}', {
                id: batch.id,
                count: batch.employeeCount,
                date: batch.updateTime?.slice(0, 10) ?? '—'
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t('匯出')}
          </Button>
          {batch.status === 1 && hasPerm(PAYROLL_PERM.CALC_RUN) && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setRecalcOpen(true)}
              disabled={recalcMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" /> {t('重新計算')}
            </Button>
          )}
          {batch.status === 1 && hasPerm(PAYROLL_PERM.CALC_SUBMIT) && (
            <Button className="gap-2" onClick={() => setConfirmOpen(true)} disabled={confirmMutation.isPending}>
              <CheckCircle className="h-4 w-4" /> {t('確認並提交')}
            </Button>
          )}
          {batch.status === 2 && (
            <Button className="gap-2" onClick={() => navigate('/payroll/distribute/new')}>
              <Send className="h-4 w-4" /> {t('生成發薪申請')}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* 合規告警橫幅 */}
      {batch.warningCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-warning">{t('{{n}} 位員工有合規告警', { n: batch.warningCount })}</span>
            <span className="text-muted-foreground">
              {' '}
              {t('— 扣款超過工資 50%（僱傭條例 s.32）或實發為負，請於明細核對後處理。')}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('搜尋員工、工號或部門...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Sections */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from(departmentGroups.entries()).map(([dept, emps]) => (
            <DepartmentSection
              key={dept}
              department={dept}
              emps={emps}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          ))}
          {departmentGroups.size === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {t('沒有符合搜尋條件的員工')}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Employee Detail Sidebar */}
        <div className="space-y-4">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selected.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selected.departmentName} · {selected.position}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('工號')}</span>
                  <span className="font-medium">{selected.employeeNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('適用方案')}</span>
                  <span className="font-medium text-primary">{selected.planName || t('未指定')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('薪資類型 / 退休計劃')}</span>
                  <span className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {t(salaryTypeLabel(selected.salaryType))}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                      {selected.retireScheme}
                    </Badge>
                  </span>
                </div>

                {/* 按比例 / 出勤 資訊 */}
                {(selected.salaryType !== 'MONTHLY' || selected.prorationRatio < 1) && (
                  <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <CalendarClock className="h-3.5 w-3.5" /> {t('計薪基準')}
                    </div>
                    {selected.salaryType === 'MONTHLY' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('在職天 / 本期天')}</span>
                          <span>
                            {t('{{worked}} / {{period}} 天', {
                              worked: selected.workedDays,
                              period: selected.periodDays
                            })}
                          </span>
                        </div>
                        {selected.noPayDays > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('無薪假')}</span>
                            <span className="text-destructive">{t('-{{n}} 天', { n: selected.noPayDays })}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium">
                          <span className="text-muted-foreground">{t('按比例係數')}</span>
                          <span>{(selected.prorationRatio * 100).toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                    {selected.salaryType === 'DAILY' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('出勤天 × 日薪')}</span>
                        <span>
                          {t('{{days}} 天 × HK$ {{rate}}', {
                            days: selected.workedDays,
                            rate: num(selected.contractBase)
                          })}
                        </span>
                      </div>
                    )}
                    {selected.salaryType === 'HOURLY' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('出勤工時 × 時薪')}</span>
                        <span>
                          {t('{{hours}} 時 × HK$ {{rate}}', {
                            hours: selected.workedHours,
                            rate: num(selected.contractBase)
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <Separator />

                {/* Earnings */}
                <div>
                  <p className="text-sm font-semibold text-success mb-2">{t('收入項目')}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('基本薪資')}</span>
                      <span className="font-medium">{num(selected.baseSalary)}</span>
                    </div>
                    {selected.allowances
                      .filter(a => !a.name.includes('（獎懲）'))
                      .map((a, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{a.name}</span>
                          <span className="font-medium">{num(a.amount)}</span>
                        </div>
                      ))}
                    {selected.overtimeAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>
                          {t('加班費')}
                          {selected.overtimeHours > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({t('{{h}} 小時', { h: selected.overtimeHours })})
                            </span>
                          )}
                        </span>
                        <span className="font-medium">{num(selected.overtimeAmount)}</span>
                      </div>
                    )}
                    {selected.allowances.filter(a => a.name.includes('（獎懲）')).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <p className="text-xs font-medium text-primary">{t('獎金（來自獎懲管理）')}</p>
                        {selected.allowances
                          .filter(a => a.name.includes('（獎懲）'))
                          .map((a, i) => (
                            <div key={`bp-${i}`} className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 bg-success/10 text-success border-success/20"
                                >
                                  {t('獎')}
                                </Badge>
                                {a.name.replace('（獎懲）', '')}
                              </span>
                              <span className="font-medium text-success">+{num(a.amount)}</span>
                            </div>
                          ))}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{t('收入小計')}</span>
                      <span className="text-success">{num(selected.totalEarnings)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deductions */}
                <div>
                  <p className="text-sm font-semibold text-destructive mb-2">{t('扣款項目')}</p>
                  <div className="space-y-2">
                    {selected.deductions
                      .filter(d => !d.name.includes('（獎懲）'))
                      .map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{d.name}</span>
                          <span className="font-medium text-destructive">-{num(d.amount)}</span>
                        </div>
                      ))}
                    {selected.deductions.filter(d => d.name.includes('（獎懲）')).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <p className="text-xs font-medium text-primary">{t('罰款（來自獎懲管理）')}</p>
                        {selected.deductions
                          .filter(d => d.name.includes('（獎懲）'))
                          .map((d, i) => (
                            <div key={`bp-d-${i}`} className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20"
                                >
                                  {t('罰')}
                                </Badge>
                                {d.name.replace('（獎懲）', '')}
                              </span>
                              <span className="font-medium text-destructive">-{num(d.amount)}</span>
                            </div>
                          ))}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{t('扣款小計')}</span>
                      <span className="text-destructive">-{num(selected.totalDeduction)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Net */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{t('實發金額')}</span>
                    <span className="text-2xl font-bold text-primary">HK$ {num(selected.netSalary)}</span>
                  </div>
                </div>

                {/* 公司承擔 */}
                <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <PiggyBank className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-semibold text-accent-foreground">{t('公司承擔（僱主供款）')}</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('僱主 {{scheme}} 供款', { scheme: selected.retireScheme })}
                      </span>
                      <span className="font-medium">HK$ {num(selected.employerContribution)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">{t('此為公司成本，不從員工實發中扣除。')}</p>
                  </div>
                </div>

                {/* 合規告警 */}
                {selected.warnings.length > 0 && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-semibold text-warning">{t('合規告警')}</span>
                    </div>
                    {selected.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{t('點擊左側員工查看薪資詳情')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('確認薪資')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('確認 {{period}} 的薪資核算結果？確認後本月「未計入」獎懲將標記為已計入，批次轉為「已確認」。', {
                period: batch.period
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmMutation.mutate()}>{t('確認')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recalculate Dialog */}
      <AlertDialog open={recalcOpen} onOpenChange={setRecalcOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('重新計算')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('重新核算 {{period}} 的薪資？將以最新的考勤、獎懲與薪資方案覆蓋本批次現有明細。', {
                period: batch.period
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => recalcMutation.mutate(batch.period)} disabled={recalcMutation.isPending}>
              {t('重新計算')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
