import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Timer,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type Approval, APPROVAL_TYPE_TEXT, approveApproval, getMyPending, rejectApproval } from '@/api/approval';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Urgency = 'normal' | 'overdue' | 'urgent';

/** 列表行：在后端单据基础上补上前端算出的等待时长/紧急度 */
interface PendingRow extends Approval {
  urgency: Urgency;
  waitingHours: number;
}

const urgencyConfig: Record<Urgency, { color: string; label: string }> = {
  normal: { label: '正常', color: 'bg-muted text-muted-foreground' },
  urgent: { label: '緊急', color: 'bg-warning/10 text-warning border-warning/20' },
  overdue: { label: '超時', color: 'bg-destructive/10 text-destructive border-destructive/20' }
};

const typeIcons: Record<number, React.ElementType> = {
  1: CalendarDays,
  2: DollarSign,
  3: Clock,
  4: MapPin,
  5: FileText,
  7: ClipboardCheck
};

/** 提交至今的小时数（submittedAt 格式 yyyy-MM-dd HH:mm） */
function waitingHoursOf(submittedAt?: string): number {
  if (!submittedAt) return 0;
  const t = new Date(submittedAt.replace(/-/g, '/')).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 3600000));
}

function urgencyOf(hours: number): Urgency {
  if (hours > 48) return 'overdue';
  if (hours > 24) return 'urgent';
  return 'normal';
}

export default function PendingApprovalTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>('urgency');
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batchComment, setBatchComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    getMyPending()
      .then(res => {
        const list = (res.data ?? []).map(a => {
          const waitingHours = waitingHoursOf(a.submittedAt);
          return { ...a, waitingHours, urgency: urgencyOf(waitingHours) };
        });
        setRows(list);
        setSelected([]);
      })
      .catch(() => setRows([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortBy === 'urgency') {
      const order: Record<Urgency, number> = { overdue: 0, urgent: 1, normal: 2 };
      copy.sort((a, b) => order[a.urgency] - order[b.urgency]);
    } else if (sortBy === 'time') {
      copy.sort((a, b) => b.waitingHours - a.waitingHours);
    }
    return copy;
  }, [rows, sortBy]);

  const toggleSelect = (id: number) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected(selected.length === sorted.length ? [] : sorted.map(r => r.id));
  };

  /** 批量审批：逐单调用，汇总成功/失败数 */
  const handleBatchSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    const comment = batchComment.trim() || undefined;
    const results = await Promise.allSettled(
      selected.map(id => (batchAction === 'approve' ? approveApproval(id, comment) : rejectApproval(id, comment)))
    );
    const okCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.length - okCount;
    const actionText = batchAction === 'approve' ? t('批量核准') : t('批量駁回');
    if (okCount > 0) toast.success(t('{{action}} {{n}} 筆申請成功', { action: actionText, n: okCount }));
    if (failCount > 0) toast.error(t('{{n}} 筆處理失敗', { n: failCount }));
    setBatchAction(null);
    setBatchComment('');
    setSubmitting(false);
    load();
  };

  const urgencyCounts = {
    overdue: rows.filter(r => r.urgency === 'overdue').length,
    urgent: rows.filter(r => r.urgency === 'urgent').length,
    normal: rows.filter(r => r.urgency === 'normal').length
  };

  return (
    <div className="space-y-4">
      {/* Urgency summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.overdue}</p>
              <p className="text-xs text-muted-foreground">{t('超時待審（>48h）')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Timer className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.urgent}</p>
              <p className="text-xs text-muted-foreground">{t('緊急待審（24-48h）')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.normal}</p>
              <p className="text-xs text-muted-foreground">{t('正常待審（<24h）')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{t('已選 {{n}} 項', { n: selected.length })}</span>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => setBatchAction('approve')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {t('批量核准')}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setBatchAction('reject')}>
                <XCircle className="h-3.5 w-3.5 mr-1" />
                {t('批量駁回')}
              </Button>
            </>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('排序方式')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">{t('按緊急程度')}</SelectItem>
            <SelectItem value="time">{t('按等待時間')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selected.length === sorted.length && sorted.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>{t('緊急度')}</TableHead>
                <TableHead>{t('申請編號')}</TableHead>
                <TableHead>{t('申請人')}</TableHead>
                <TableHead>{t('部門')}</TableHead>
                <TableHead>{t('申請類型')}</TableHead>
                <TableHead>{t('摘要')}</TableHead>
                <TableHead>{t('等待時間')}</TableHead>
                <TableHead>{t('當前節點')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(r => {
                const uc = urgencyConfig[r.urgency];
                const TypeIcon = typeIcons[r.type] || FileText;
                return (
                  <TableRow
                    key={r.id}
                    className={`cursor-pointer hover:bg-muted/50 ${r.urgency === 'overdue' ? 'bg-destructive/5' : ''}`}
                    onClick={() => navigate(`/attendance/approval/${r.id}`)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                    </TableCell>
                    <TableCell>
                      <Badge className={`${uc.color} border`}>
                        {r.urgency === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {t(uc.label)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.applicantName}</TableCell>
                    <TableCell>{r.departmentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {t(APPROVAL_TYPE_TEXT[r.type] ?? r.typeName ?? '')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{r.summary}</TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${r.waitingHours > 48 ? 'text-destructive' : r.waitingHours > 24 ? 'text-warning' : 'text-muted-foreground'}`}
                      >
                        {r.waitingHours}h
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{r.currentNode}</TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-success" />
                    <p>{t('目前沒有待審批的申請 🎉')}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch action dialog */}
      <Dialog open={Boolean(batchAction)} onOpenChange={() => setBatchAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{batchAction === 'approve' ? t('批量核准') : t('批量駁回')}</DialogTitle>
            <DialogDescription>
              {t('即將 {{action}} {{n}} 筆申請', {
                action: batchAction === 'approve' ? t('核准') : t('駁回'),
                n: selected.length
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">{t('選中的申請：')}</p>
              <div className="space-y-1">
                {sorted
                  .filter(r => selected.includes(r.id))
                  .map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.code}</span>
                      <span>
                        {r.applicantName} - {r.summary}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('審批意見（選填）')}</p>
              <Textarea
                placeholder={t('請輸入審批意見...')}
                value={batchComment}
                onChange={e => setBatchComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchAction(null)}>
              {t('取消')}
            </Button>
            <Button
              className={batchAction === 'approve' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
              variant={batchAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleBatchSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('確認')}
              {batchAction === 'approve' ? t('核准') : t('駁回')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
