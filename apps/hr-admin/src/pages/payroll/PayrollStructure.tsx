import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  TrendingUp,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { deletePayrollPlan, getPayrollPlans, type PayrollPlan, togglePayrollPlan } from '@/api/payroll';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasPerm } from '@/lib/auth';
import { PAYROLL_PERM } from '@/lib/perms';
import PayrollParams from '@/pages/payroll/PayrollParams';

const statusColors: Record<string, string> = {
  啟用: 'bg-success/10 text-success border-success/20',
  停用: 'bg-muted text-muted-foreground border-border'
};

export default function PayrollStructure() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<PayrollPlan | null>(null);
  const [disableTarget, setDisableTarget] = useState<PayrollPlan | null>(null);

  const statusParam = statusFilter === '啟用' ? 1 : statusFilter === '停用' ? 2 : undefined;

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['payrollPlans', search, statusParam],
    queryFn: () => getPayrollPlans({ keyword: search || undefined, status: statusParam }).then(r => r.data)
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payrollPlans'] });

  const toggleMutation = useMutation({
    mutationFn: ({ enabled, id }: { enabled: boolean; id: number }) => togglePayrollPlan(id, enabled),
    onSuccess: (_r, v) => {
      toast.success(v.enabled ? t('已啟用方案') : t('已停用方案'));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || t('操作失敗'))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayrollPlan(id),
    onSuccess: () => {
      toast.success(t('已刪除方案'));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || t('刪除失敗'))
  });

  const handleToggleStatus = (plan: PayrollPlan) => {
    if (plan.enabled) {
      setDisableTarget(plan);
    } else {
      toggleMutation.mutate({ id: plan.id, enabled: true });
    }
  };

  const confirmDisable = () => {
    if (!disableTarget) return;
    toggleMutation.mutate({ id: disableTarget.id, enabled: false });
    setDisableTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const stats = [
    { label: '方案總數', value: plans.length, icon: FileText, color: 'text-primary' },
    { label: '啟用中', value: plans.filter(p => p.enabled).length, icon: TrendingUp, color: 'text-success' },
    {
      label: '適用員工',
      value: plans.reduce((s, p) => s + (p.applicableCount || 0), 0),
      icon: Users,
      color: 'text-accent'
    },
    { label: '已停用', value: plans.filter(p => !p.enabled).length, icon: Power, color: 'text-muted-foreground' }
  ];

  const fmt = (n: number | null | undefined) => Number(n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              {t('薪資方案')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('管理薪資方案與核算參數')}</p>
          </div>
          <TabsList>
            <TabsTrigger value="plans">{t('方案列表')}</TabsTrigger>
            <TabsTrigger value="params">{t('薪資參數')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="space-y-6 mt-0">
          <div className="flex justify-end">
            {hasPerm(PAYROLL_PERM.PLAN_ADD) && (
              <Button onClick={() => navigate('/payroll/structure/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('新增方案')}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{t(s.label)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('搜尋方案名稱/代碼...')}
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部狀態')}</SelectItem>
                <SelectItem value="啟用">{t('啟用')}</SelectItem>
                <SelectItem value="停用">{t('停用')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('方案名稱')}</TableHead>
                    <TableHead>{t('代碼')}</TableHead>
                    <TableHead>{t('基本薪資範圍')}</TableHead>
                    <TableHead>{t('津貼')}</TableHead>
                    <TableHead>{t('扣款')}</TableHead>
                    <TableHead>{t('適用對象')}</TableHead>
                    <TableHead>{t('適用人數')}</TableHead>
                    <TableHead>{t('狀態')}</TableHead>
                    <TableHead>{t('更新日期')}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {t('載入中...')}
                      </TableCell>
                    </TableRow>
                  ) : plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {t('暫無方案')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map(p => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/payroll/structure/${p.id}`)}
                      >
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{p.code}</TableCell>
                        <TableCell className="text-sm">
                          {fmt(p.baseSalaryMin)} ~ {fmt(p.baseSalaryMax)}
                        </TableCell>
                        <TableCell className="text-sm">{fmt(p.allowanceSum)}</TableCell>
                        <TableCell className="text-sm">{fmt(p.insuranceSum)}</TableCell>
                        <TableCell>{p.applicable || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {t('{{n}} 人', { n: p.applicableCount })}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[p.enabled ? '啟用' : '停用']} border text-xs`}>
                            {p.enabled ? t('啟用') : t('停用')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.updateTime?.slice(0, 10) || '—'}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/payroll/structure/${p.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('查看詳情')}
                              </DropdownMenuItem>
                              {hasPerm(PAYROLL_PERM.PLAN_EDIT) && (
                                <DropdownMenuItem onClick={() => navigate(`/payroll/structure/${p.id}/edit`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t('編輯方案')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {hasPerm(PAYROLL_PERM.PLAN_TOGGLE) && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(p)}>
                                  <Power className="h-4 w-4 mr-2" />
                                  {p.enabled ? t('停用方案') : t('啟用方案')}
                                </DropdownMenuItem>
                              )}
                              {hasPerm(PAYROLL_PERM.PLAN_DELETE) && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(p)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('刪除方案')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="params" className="mt-0">
          <PayrollParams />
        </TabsContent>
      </Tabs>

      {/* Disable Confirm */}
      <AlertDialog open={Boolean(disableTarget)} onOpenChange={o => !o && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('確認停用方案')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                '停用「{{name}}」後，該方案將不再適用於新的薪資計算。目前適用 {{count}} 名員工，停用後需為其重新指派方案。',
                { name: disableTarget?.name ?? '', count: disableTarget?.applicableCount ?? 0 }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>{t('確認停用')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('確認刪除方案')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('確定要刪除「{{name}}」嗎？此操作無法復原。', { name: deleteTarget?.name ?? '' })}
              {deleteTarget &&
                deleteTarget.applicableCount > 0 &&
                t('目前仍有 {{count}} 名員工適用此方案，需先解除分配才能刪除。', {
                  count: deleteTarget.applicableCount
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('確認刪除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
