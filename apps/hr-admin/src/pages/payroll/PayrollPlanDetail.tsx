import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Gift,
  Landmark,
  Pencil,
  Power,
  Receipt,
  Shield,
  Trash2,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deletePayrollPlan, getPayrollPlanDetail, type PlanItem, togglePayrollPlan } from '@/api/payroll';
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
import { Separator } from '@/components/ui/separator';
import { hasPerm } from '@/lib/auth';
import { PAYROLL_PERM } from '@/lib/perms';

const statusColors: Record<string, string> = {
  啟用: 'bg-success/10 text-success border-success/20',
  停用: 'bg-muted text-muted-foreground border-border'
};

const fmt = (n: number | null | undefined) => Number(n || 0).toLocaleString();
const itemTypeLabel = (i: PlanItem) => (i.calcType === 2 ? '百分比' : '固定');
const itemValueLabel = (i: PlanItem) => (i.calcType === 2 ? `${i.value}%` : `HK$${fmt(i.value)}`);

const OVERTIME_BASE_LABEL: Record<string, string> = { hourly: '時薪制', daily: '日薪制', monthly: '月薪制' };
const TAX_TYPE_LABEL: Record<number, string> = { 1: '累進', 2: '固定比例', 3: '免稅' };
const overtimeBaseLabel = (v?: string | null) => (v ? OVERTIME_BASE_LABEL[v] || v : '—');
const taxTypeLabel = (v?: number | null) => (v != null ? TAX_TYPE_LABEL[Number(v)] || '—' : '—');
const dash = (v: string | number | null | undefined) => (v != null && v !== '' ? String(v) : '—');

export default function PayrollPlanDetail() {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDisable, setShowDisable] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const planIdNum = planId ? Number(planId) : undefined;

  const { data: plan, isLoading } = useQuery({
    queryKey: ['payrollPlanDetail', planIdNum],
    queryFn: () => getPayrollPlanDetail(planIdNum!).then(r => r.data),
    enabled: Boolean(planIdNum)
  });

  const toggleMutation = useMutation({
    mutationFn: ({ enabled, id }: { enabled: boolean; id: number }) => togglePayrollPlan(id, enabled),
    onSuccess: (_r, v) => {
      toast.success(v.enabled ? t('已啟用方案') : t('已停用方案'));
      queryClient.invalidateQueries({ queryKey: ['payrollPlanDetail', planIdNum] });
      queryClient.invalidateQueries({ queryKey: ['payrollPlans'] });
      setShowDisable(false);
    },
    onError: (e: Error) => toast.error(e.message || t('操作失敗'))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayrollPlan(id),
    onSuccess: () => {
      toast.success(t('已刪除方案'));
      queryClient.invalidateQueries({ queryKey: ['payrollPlans'] });
      navigate('/payroll/structure');
    },
    onError: (e: Error) => toast.error(e.message || t('刪除失敗'))
  });

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">{t('載入中...')}</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('找不到該薪資方案')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/payroll/structure')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('返回薪資結構')}
        </Button>
      </div>
    );
  }

  const statusText = plan.enabled ? '啟用' : '停用';
  const earnings = (plan.items || []).filter(i => i.category === 1);
  const deductions = (plan.items || []).filter(i => i.category === 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/structure')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {plan.name}
              <Badge className={`${statusColors[statusText]} border text-xs ml-2`}>{t(statusText)}</Badge>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm font-mono">{plan.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPerm(PAYROLL_PERM.PLAN_TOGGLE) && (
            <Button variant="outline" onClick={() => setShowDisable(true)}>
              <Power className="h-4 w-4 mr-2" />
              {plan.enabled ? t('停用') : t('啟用')}
            </Button>
          )}
          {hasPerm(PAYROLL_PERM.PLAN_DELETE) && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('刪除')}
            </Button>
          )}
          {hasPerm(PAYROLL_PERM.PLAN_EDIT) && (
            <Button onClick={() => navigate(`/payroll/structure/${plan.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('編輯方案')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {t('基本資訊')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('方案名稱')}</p>
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('方案代碼')}</p>
                  <p className="text-sm font-mono text-foreground">{plan.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('薪資幣別')}</p>
                  <p className="text-sm font-medium text-foreground">{plan.currency || 'HKD'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('適用對象')}</p>
                  <p className="text-sm font-medium text-foreground">{plan.applicable || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('適用人數')}</p>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {t('{{n}} 人', { n: plan.applicableCount })}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('建立日期')}</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {plan.createTime?.slice(0, 10) || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('最後更新')}</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {plan.updateTime?.slice(0, 10) || '—'}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('方案說明')}</p>
                <p className="text-sm text-foreground leading-relaxed">{plan.description || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Salary Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {t('薪資範圍')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('最低基本薪資')}</p>
                  <p className="text-lg font-bold text-primary">HK${fmt(plan.baseSalaryMin)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('最高基本薪資')}</p>
                  <p className="text-lg font-bold text-primary">HK${fmt(plan.baseSalaryMax)}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('津貼合計')}</p>
                  <p className="text-lg font-bold text-success">HK${fmt(plan.allowanceSum)}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('扣款合計')}</p>
                  <p className="text-lg font-bold text-warning">HK${fmt(plan.insuranceSum)}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('試用期薪資比例')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {plan.probationRatio != null ? `${plan.probationRatio}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('加班費計算基準')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {overtimeBaseLabel(plan.overtimeBase) === '—' ? '—' : t(overtimeBaseLabel(plan.overtimeBase))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('含年終獎金')}</p>
                  <p className="text-sm font-medium text-foreground">{plan.includeBonus ? t('是') : t('否')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 退休金 / 稅務 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                {t('退休金 / 稅務')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('強積金 / 退休金')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('適用地區')}</p>
                    <p className="text-sm font-medium text-foreground">{dash(plan.retireRegion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('計劃名稱')}</p>
                    <p className="text-sm font-medium text-foreground">{dash(plan.retireName)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('供款比率（員工 / 僱主）')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.retireEmpRate != null ? `${plan.retireEmpRate}%` : '—'} /{' '}
                      {plan.retireEmployerRate != null ? `${plan.retireEmployerRate}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('供款基數下限')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.retireMin != null ? `HK$${fmt(plan.retireMin)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('供款基數上限')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.retireMax != null ? `HK$${fmt(plan.retireMax)}` : '—'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t('※ 此為方案默認值；員工檔案另有設定時，核算以員工檔案為準（法定 MPF 上下限與封頂由系統固定）。')}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('稅務規則')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('稅務地區')}</p>
                    <p className="text-sm font-medium text-foreground">{dash(plan.taxRegion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('計稅方式')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {taxTypeLabel(plan.taxType) === '—' ? '—' : t(taxTypeLabel(plan.taxType))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('稅率')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.taxRate != null ? `${plan.taxRate}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('起徵點')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.taxThreshold != null ? `HK$${fmt(plan.taxThreshold)}` : '—'}
                    </p>
                  </div>
                </div>
                {plan.taxRegion === '香港' && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {t('※ 香港無 PAYE，稅款僅供資訊 / IR56 口徑，不從實發中扣除。')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 支付設定 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t('支付設定')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('預設支付方式')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {plan.paymentMethod ? t(plan.paymentMethod) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('發薪日（每月）')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {plan.payDay != null ? t('{{n}} 號', { n: plan.payDay }) : '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {t('員工資料中若另有指定支付方式，將優先於方案預設值。')}
              </p>
            </CardContent>
          </Card>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-success" />
                  {t('加項明細')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('無加項')}</p>
                  )}
                  {earnings.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          {item.name}
                          {item.mpfIncluded && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                            >
                              {t('計MPF')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{t(itemTypeLabel(item))}</p>
                      </div>
                      <p className="text-sm font-bold text-success">{itemValueLabel(item)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />
                  {t('減項明細')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deductions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('無減項')}</p>
                  )}
                  {deductions.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{t(itemTypeLabel(item))}</p>
                      </div>
                      <p className="text-sm font-bold text-warning">{itemValueLabel(item)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Applicable Employees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t('適用員工')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-3xl font-bold text-primary">{plan.applicableCount}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('名員工使用此方案')}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t('於「員工資料」為員工指派薪資方案；停用/刪除前需先解除分配。')}
              </p>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('方案摘要')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: '狀態', value: t(statusText) },
                { label: '加項數', value: t('{{n}} 項', { n: earnings.length }) },
                { label: '減項數', value: t('{{n}} 項', { n: deductions.length }) },
                { label: '強積金 MPF / ORSO', value: t('依員工設定自動計算') }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t(item.label)}</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disable Dialog */}
      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{plan.enabled ? t('確認停用方案') : t('確認啟用方案')}</AlertDialogTitle>
            <AlertDialogDescription>
              {plan.enabled
                ? t('停用「{{name}}」後，該方案將不再適用於新的薪資計算。目前適用 {{count}} 名員工。', {
                    name: plan.name,
                    count: plan.applicableCount
                  })
                : t('確認要重新啟用「{{name}}」嗎？', { name: plan.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleMutation.mutate({ id: plan.id, enabled: !plan.enabled })}>
              {t('確認')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('確認刪除方案')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('確定要刪除「{{name}}」嗎？此操作無法復原。', { name: plan.name })}
              {plan.applicableCount > 0 &&
                t('目前仍有 {{count}} 名員工適用此方案，需先解除分配才能刪除。', { count: plan.applicableCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(plan.id)}
            >
              {t('確認刪除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
