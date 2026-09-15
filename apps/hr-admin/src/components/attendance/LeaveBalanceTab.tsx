import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, History, Loader2, PlayCircle, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  accrueLeave,
  adjustLeaveBalance,
  getLeaveBalances,
  getLeaveLedger,
  type LeaveBalance,
  LEDGER_TYPE
} from '@/api/leaveBalance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { LEAVE_PERM } from '@/lib/perms';

/** 天數顯示：去掉無意義的小數尾巴（12.00 → 12，0.50 → 0.5） */
const fmt = (n?: number | null) => {
  if (n == null) return '0';
  return String(Number(n));
};

/** 流水類型 → 徽章配色。增額為正向色，減額為警示色 */
const txnColor: Record<number, string> = {
  [LEDGER_TYPE.GRANT]: 'bg-success/10 text-success border-success/20',
  [LEDGER_TYPE.CARRY_IN]: 'bg-primary/10 text-primary border-primary/20',
  [LEDGER_TYPE.USE]: 'bg-muted text-muted-foreground border-border',
  [LEDGER_TYPE.EXPIRE]: 'bg-destructive/10 text-destructive border-destructive/20',
  [LEDGER_TYPE.CASH_OUT]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  [LEDGER_TYPE.ADJUST]: 'bg-warning/10 text-warning border-warning/20',
  [LEDGER_TYPE.REVERSE]: 'bg-accent/10 text-accent border-accent/20'
};

export function LeaveBalanceTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  // 額度类型：annual 年假 / CO 補休（加班折換）
  const [leaveCode, setLeaveCode] = useState<'annual' | 'CO'>('annual');
  const isComp = leaveCode === 'CO';
  const leaveLabel = isComp ? t('補休') : t('年假');
  const [search, setSearch] = useState('');
  const [ledgerOf, setLedgerOf] = useState<LeaveBalance | null>(null);
  const [adjustOf, setAdjustOf] = useState<LeaveBalance | null>(null);
  const [adjustDays, setAdjustDays] = useState('');
  const [adjustExpire, setAdjustExpire] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  // 本地今天 / 明天（YYYY-MM-DD）：過期日至少要明天，避免建立即過期的額度桶
  const todayStr = new Date().toLocaleDateString('en-CA');
  const minExpire = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['leaveBalances', leaveCode],
    queryFn: async () => (await getLeaveBalances({ leaveCode })).data ?? []
  });

  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['leaveLedger', ledgerOf?.employeeId, leaveCode],
    queryFn: async () => (await getLeaveLedger(ledgerOf!.employeeId, leaveCode)).data ?? [],
    enabled: Boolean(ledgerOf)
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['leaveBalances'] });

  const accrueMut = useMutation({
    mutationFn: () => accrueLeave(),
    onSuccess: res => {
      toast.success(t('發放完成，新增發放 {{n}} 人次', { n: res.data ?? 0 }));
      refresh();
    }
  });

  const adjustMut = useMutation({
    mutationFn: adjustLeaveBalance,
    onSuccess: () => {
      toast.success(t('已調整額度'));
      closeAdjust();
      refresh();
      qc.invalidateQueries({ queryKey: ['leaveLedger'] });
    }
  });

  const closeAdjust = () => {
    setAdjustOf(null);
    setAdjustDays('');
    setAdjustExpire('');
    setAdjustRemark('');
  };

  const submitAdjust = () => {
    if (!adjustOf) return;
    const days = Number(adjustDays);
    if (!adjustDays || Number.isNaN(days) || days === 0) {
      toast.error(t('請填寫調整天數（正數補發／負數扣減）'));
      return;
    }
    if (!adjustRemark.trim()) {
      toast.error(t('請填寫調整原因'));
      return;
    }
    // 補發時過期日必須晚於今天，否則額度一建立就過期、無法使用
    if (days > 0 && adjustExpire && adjustExpire <= todayStr) {
      toast.error(t('過期日必須晚於今天，請重新選擇'));
      return;
    }
    adjustMut.mutate({
      employeeId: adjustOf.employeeId,
      leaveCode,
      days,
      expireDate: days > 0 && adjustExpire ? adjustExpire : undefined,
      remark: adjustRemark.trim()
    });
  };

  const filtered = search.trim() ? balances.filter(b => b.employeeName?.includes(search.trim())) : balances;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              {leaveLabel}
              {t('額度')}
            </CardTitle>
            <CardDescription>
              {isComp
                ? t('加班選「折換補休」核准後折成天數記入；休補休時扣減。有效期為加班日起 3 個月')
                : t('額度以账本流水記錄，餘額由流水聚合得出；改年資階梯不會追溯影響已發放的額度')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* 年假 / 補休 切換 */}
            <div className="inline-flex rounded-md border border-border p-0.5">
              {(['annual', 'CO'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setLeaveCode(c)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    leaveCode === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {c === 'CO' ? t('補休') : t('年假')}
                </button>
              ))}
            </div>
            {/* 執行發放僅年假（補休由加班核准自動發放） */}
            {!isComp && hasPerm(LEAVE_PERM.ADJUST) && (
              <Button onClick={() => accrueMut.mutate()} disabled={accrueMut.isPending}>
                {accrueMut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-1" />
                )}
                {t('執行發放')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('搜尋員工姓名...')}
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('員工')}</TableHead>
                <TableHead>{t('部門')}</TableHead>
                <TableHead className="text-right">{t('累計發放')}</TableHead>
                <TableHead className="text-right">{t('已使用')}</TableHead>
                <TableHead className="text-right">{t('已過期')}</TableHead>
                <TableHead className="text-right">{t('調整')}</TableHead>
                <TableHead className="text-right">{t('剩餘')}</TableHead>
                <TableHead>{t('即將過期')}</TableHead>
                <TableHead className="text-right">{t('操作')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    {t('載入中...')}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isComp
                      ? t('暫無補休額度，員工加班選「折換補休」核准後自動記入')
                      : t('暫無額度資料，點右上角「執行發放」按政策發放年假')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(b => (
                  <TableRow key={b.employeeId}>
                    <TableCell className="font-medium">{b.employeeName}</TableCell>
                    <TableCell className="text-muted-foreground">{b.departmentName || '-'}</TableCell>
                    <TableCell className="text-right">{fmt(b.granted)}</TableCell>
                    <TableCell className="text-right">{fmt(b.used)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(b.expired)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(b.adjusted)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{fmt(b.remaining)}</TableCell>
                    <TableCell>
                      {b.expiringDays && b.expiringDate ? (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-normal">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t('{{n}} 天', { n: fmt(b.expiringDays) })} / {b.expiringDate}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" title={t('查看账本')} onClick={() => setLedgerOf(b)}>
                        <History className="h-4 w-4" />
                      </Button>
                      {hasPerm(LEAVE_PERM.ADJUST) && (
                        <Button variant="ghost" size="icon" title={t('調整額度')} onClick={() => setAdjustOf(b)}>
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 账本流水 */}
      <Dialog open={Boolean(ledgerOf)} onOpenChange={o => !o && setLedgerOf(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {ledgerOf?.employeeName} — {leaveLabel}
              {t('账本')}
            </DialogTitle>
            <DialogDescription>{t('每一筆額度變動都留痕，可據此向員工解釋餘額怎麼來的')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('類型')}</TableHead>
                  <TableHead className="text-right">{t('天數')}</TableHead>
                  <TableHead>{t('生效日')}</TableHead>
                  <TableHead>{t('過期日')}</TableHead>
                  <TableHead>{t('說明')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      {t('載入中...')}
                    </TableCell>
                  </TableRow>
                ) : ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('暫無流水')}
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Badge variant="outline" className={`${txnColor[l.txnType] || ''} font-normal`}>
                          {t(l.txnTypeName ?? '')}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${Number(l.days) < 0 ? 'text-destructive' : 'text-success'}`}
                      >
                        {Number(l.days) > 0 ? '+' : ''}
                        {fmt(l.days)}
                      </TableCell>
                      <TableCell className="text-sm">{l.effectiveDate || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.expireDate || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.remark || '-'}
                        {l.sourceRef && <span className="ml-1 font-mono">({l.sourceRef})</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 手工調整 */}
      <Dialog open={Boolean(adjustOf)} onOpenChange={o => !o && closeAdjust()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('調整額度')} — {adjustOf?.employeeName}
            </DialogTitle>
            <DialogDescription>
              {t('正數補發、負數扣減（扣減按過期日 FIFO）。目前剩餘 {{n}} 天', { n: fmt(adjustOf?.remaining) })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('調整天數 *')}</Label>
              <Input
                type="number"
                step="0.5"
                placeholder={t('如 1.5 或 -2')}
                value={adjustDays}
                onChange={e => setAdjustDays(e.target.value)}
              />
            </div>
            {Number(adjustDays) > 0 && (
              <div className="space-y-2">
                <Label>{t('過期日（留空=永不過期）')}</Label>
                <Input type="date" min={minExpire} value={adjustExpire} onChange={e => setAdjustExpire(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('調整原因 *')}</Label>
              <Textarea
                rows={2}
                placeholder={t('留痕用，例如：補發 2025 年度漏發年假')}
                value={adjustRemark}
                onChange={e => setAdjustRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdjust}>
              {t('取消')}
            </Button>
            <Button onClick={submitAdjust} disabled={adjustMut.isPending}>
              {adjustMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('確認調整')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
