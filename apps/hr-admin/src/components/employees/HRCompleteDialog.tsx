import { Check, CheckCircle2, ChevronsUpDown, Loader2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type AttendanceSchedule, getScheduleOptions } from '@/api/attendance';
import {
  type Employee,
  type EmployeeOption,
  type EmployeeUpdatePayload,
  getActiveEmployeeOptions,
  getEmployeeById,
  updateEmployee
} from '@/api/employee';
import { getPayrollPlanDetail, getPayrollPlanOptions, type PayrollPlanOption } from '@/api/payroll';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrgOptions } from '@/hooks/useOrgOptions';
import { getUser } from '@/lib/auth';
import { SALARY_TYPES } from '@/lib/salaryType';
import { cn } from '@/lib/utils';

interface HRCompleteDialogProps {
  employee: Employee | null;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

/** HR 補充欄位的表單狀態 */
interface CompleteForm {
  adwOvertime: string;
  bankRatio: string;
  baseSalary: string;
  contributionType: string;
  department: string;
  departmentId: string;
  employerMpf: string;
  employerOrso: string;
  // 直屬主管（在職員工 id，字串）
  employmentType: string;
  empMpfType: string;
  joinDate: string;
  managerId: string;
  mpfType: string;
  orsoEmployerRatio: string;
  orsoEmpRatio: string;
  orsoType: string;
  paymentType: string;
  // 薪資方案（payroll_plan id，字串）
  payrollGroup: string;
  position: string;
  positionId: string;
  probation: string;
  probationPassDate: string;
  // 打卡班次（attendance_schedule id，字串）
  remark: string;
  salaryPlanId: string;
  salaryType: string;
  scheduleId: string;
  storeCategory: string; // 備註 → complete_remark
}

/** 完善表單的空白預設（新增字段集中一處，避免多處遺漏） */
const EMPTY_COMPLETE_FORM: CompleteForm = {
  departmentId: '',
  department: '',
  positionId: '',
  position: '',
  managerId: '',
  employmentType: '',
  probation: '3',
  probationPassDate: '',
  storeCategory: '',
  salaryType: '',
  baseSalary: '',
  salaryPlanId: '',
  payrollGroup: '',
  adwOvertime: '0',
  bankRatio: '100',
  joinDate: '',
  mpfType: '',
  empMpfType: '',
  contributionType: '',
  orsoType: '',
  orsoEmpRatio: '',
  orsoEmployerRatio: '',
  employerMpf: '',
  employerOrso: '',
  paymentType: '銀行轉帳',
  scheduleId: '',
  remark: ''
};

export function HRCompleteDialog({ employee, onOpenChange, onSuccess, open }: HRCompleteDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CompleteForm>({ ...EMPTY_COMPLETE_FORM });
  const { departments, positions } = useOrgOptions(form.departmentId ? Number(form.departmentId) : undefined);
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [plans, setPlans] = useState<PayrollPlanOption[]>([]);
  useEffect(() => {
    getScheduleOptions()
      .then(res => setSchedules(res.data ?? []))
      .catch(() => setSchedules([]));
    getPayrollPlanOptions()
      .then(res => setPlans(res.data ?? []))
      .catch(() => setPlans([]));
  }, []);

  // 選薪資方案：以方案的公積金供款比例覆蓋兩個比例欄位（與員工詳情一致，方案為準）
  const handlePickPlan = async (v: string) => {
    set('salaryPlanId', v);
    if (!v) return;
    try {
      const { data: detail } = await getPayrollPlanDetail(Number(v));
      if (!detail) return;
      if (detail.retireEmpRate != null) set('orsoEmpRatio', String(detail.retireEmpRate));
      if (detail.retireEmployerRate != null) set('orsoEmployerRatio', String(detail.retireEmployerRate));
    } catch {
      /* 靜默 */
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [managerOptions, setManagerOptions] = useState<EmployeeOption[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  // 當前登入用戶（負責HR）：登入時已緩存，直接讀取
  const currentUser = getUser();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof CompleteForm>(k: K, v: CompleteForm[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(prev => {
      if (!prev[k as string]) return prev;
      const next = { ...prev };
      delete next[k as string];
      return next;
    });
  };

  // 必填校驗：部門/職位/僱用類型/薪資類型/基本薪金/入職日期
  const REQUIRED: { key: keyof CompleteForm; label: string }[] = [
    { key: 'department', label: '確認部門' },
    { key: 'position', label: '確認職位' },
    { key: 'employmentType', label: '僱用類型' },
    { key: 'salaryType', label: '薪資類型' },
    { key: 'baseSalary', label: '基本薪金' },
    { key: 'joinDate', label: '確認入職日期' }
  ];
  const validate = () => {
    const next: Record<string, string> = {};
    REQUIRED.forEach(({ key, label }) => {
      if (!String(form[key] ?? '').trim()) next[key as string] = t('請填寫{{label}}', { label: t(label) });
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // 打開時：先用列表行資料兜底，再調詳情接口回顯完整欄位；並載入在職員工下拉
  useEffect(() => {
    if (open && employee) {
      // 先用列表行已有資料兜底，避免詳情未回來前空白
      setForm({
        ...EMPTY_COMPLETE_FORM,
        department: employee.department || '',
        position: employee.position || '',
        joinDate: employee.joinDate || ''
      });
      setErrors({});
      getActiveEmployeeOptions()
        .then(res => setManagerOptions(res.data || []))
        .catch(() => setManagerOptions([]));
      // 調詳情接口回顯完整欄位（基本薪金/薪資類型/僱用類型/強積金/試用期等）
      if (employee.id) {
        getEmployeeById(employee.id)
          .then(res => {
            const d = res.data;
            if (!d) return;
            setForm({
              departmentId: d.departmentId != null ? String(d.departmentId) : '',
              department: d.department || employee.department || '',
              positionId: d.positionId != null ? String(d.positionId) : '',
              position: d.position || employee.position || '',
              managerId: d.managerId != null ? String(d.managerId) : '',
              employmentType: d.employmentType || '',
              probation: d.probation != null ? String(d.probation) : '3',
              probationPassDate: d.probationPassDate || '',
              storeCategory: d.storeCategory || '',
              salaryType: d.salaryType || '',
              baseSalary: d.baseSalary != null ? String(d.baseSalary) : '',
              salaryPlanId: d.salaryPlanId != null ? String(d.salaryPlanId) : '',
              payrollGroup: d.payrollGroup || '',
              adwOvertime: d.adwOvertime != null ? String(d.adwOvertime) : '0',
              bankRatio: d.bankRatio != null ? String(d.bankRatio) : '100',
              joinDate: d.joinDate || employee.joinDate || '',
              mpfType: d.mpfType || '',
              empMpfType: d.empMpfType || '',
              contributionType: d.contributionType || '',
              orsoType: d.orsoType || '',
              orsoEmpRatio: d.orsoEmpRatio != null ? String(d.orsoEmpRatio) : '',
              orsoEmployerRatio: d.orsoEmployerRatio != null ? String(d.orsoEmployerRatio) : '',
              employerMpf: d.employerMpf || '',
              employerOrso: d.employerOrso || '',
              paymentType: d.paymentType || '銀行轉帳',
              scheduleId: d.scheduleId != null ? String(d.scheduleId) : '',
              remark: d.completeRemark || ''
            });
          })
          .catch(() => {
            /* 詳情失敗則保留列表兜底值 */
          });
      }
    }
  }, [open, employee]);

  if (!employee) return null;

  const handleSubmit = async () => {
    if (!employee.id) {
      toast.error(t('員工 id 缺失，無法完善'));
      return;
    }
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      // 直屬主管：從在職下拉選中項取 id + 姓名（冗余）
      const manager = managerOptions.find(o => String(o.id) === form.managerId);
      // 完善：更新原員工記錄，狀態由「待HR完善」轉為 2=待入職
      const payload: EmployeeUpdatePayload = {
        id: employee.id,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        department: form.department.trim() || undefined,
        positionId: form.positionId ? Number(form.positionId) : undefined,
        position: form.position.trim() || undefined,
        employmentType: form.employmentType || undefined,
        probation: form.probation ? Number(form.probation) : undefined,
        probationPassDate: form.probationPassDate || undefined,
        storeCategory: form.storeCategory || undefined,
        salaryType: form.salaryType || undefined,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        salaryPlanId: form.salaryPlanId ? Number(form.salaryPlanId) : undefined,
        payrollGroup: form.payrollGroup || undefined,
        adwOvertime: form.adwOvertime !== '' ? Number(form.adwOvertime) : undefined,
        bankRatio: form.bankRatio !== '' ? Number(form.bankRatio) : undefined,
        joinDate: form.joinDate || undefined,
        paymentType: form.paymentType || undefined,
        mpfType: form.mpfType || undefined,
        empMpfType: form.empMpfType || undefined,
        contributionType: form.contributionType || undefined,
        orsoType: form.orsoType || undefined,
        orsoEmpRatio: form.orsoEmpRatio !== '' ? Number(form.orsoEmpRatio) : undefined,
        orsoEmployerRatio: form.orsoEmployerRatio !== '' ? Number(form.orsoEmployerRatio) : undefined,
        employerMpf: form.employerMpf || undefined,
        employerOrso: form.employerOrso || undefined,
        scheduleId: form.scheduleId ? Number(form.scheduleId) : undefined,
        managerId: manager ? manager.id : undefined,
        managerName: manager ? manager.name : undefined,
        hrOwnerId: currentUser ? currentUser.userId : undefined,
        hrOwnerName: currentUser ? currentUser.userName : undefined,
        completeRemark: form.remark.trim() || undefined,
        status: 2 // 2=待入職
      };
      await updateEmployee(payload);
      toast.success(t('已提交 {{name}} 的資料，已轉入入職管理', { name: employee.name }));
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || t('提交失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {t('完善員工資料 — {{name}}', { name: employee.name })}
          </DialogTitle>
          <DialogDescription>
            {t(
              '員工已透過邀請連結提交個人資料，請 HR 補充組織與薪資相關欄位後提交，系統將自動建立員工檔案並轉入「入職管理」流程。'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 員工自填資料 */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{t('員工自填資料（已完成）')}</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">{t('工號：')}</span>
              {employee.employeeNo || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">{t('姓名：')}</span>
              {employee.name || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">{t('電話：')}</span>
              {employee.phone || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">{t('部門意向：')}</span>
              {employee.department || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">{t('職位意向：')}</span>
              {employee.position || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">{t('預定入職：')}</span>
              {employee.joinDate || '—'}
            </div>
          </div>
        </div>

        {/* HR 補充 */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t('HR 補充 — 組織與薪資設定')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="員工編號">
              <Input value={employee.employeeNo || ''} placeholder={t('系統自動生成')} readOnly />
            </Field>
            <Field label="確認部門" required error={errors.department}>
              <Select
                value={form.departmentId || undefined}
                onValueChange={v => {
                  set('departmentId', v);
                  set('department', departments.find(d => String(d.id) === v)?.name ?? '');
                  set('positionId', '');
                  set('position', '');
                }}
              >
                <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="確認職位" required error={errors.position}>
              <Select
                value={form.positionId || undefined}
                onValueChange={v => {
                  set('positionId', v);
                  set('position', positions.find(p => String(p.id) === v)?.title ?? '');
                }}
              >
                <SelectTrigger className={errors.position ? 'border-destructive' : ''}>
                  <SelectValue placeholder={form.departmentId ? t('請選擇') : t('請先選擇部門')} />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="直屬主管">
              <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    <span className={cn('truncate', !form.managerId && 'text-muted-foreground')}>
                      {(() => {
                        const sel = managerOptions.find(o => String(o.id) === form.managerId);
                        return sel
                          ? `${sel.name}${sel.employeeNo ? `（${sel.employeeNo}）` : ''}`
                          : t('請搜尋並選擇在職員工');
                      })()}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('輸入姓名/工號搜尋...')} />
                    <CommandList>
                      <CommandEmpty>{t('查無在職員工')}</CommandEmpty>
                      {managerOptions.map(o => (
                        <CommandItem
                          key={o.id}
                          value={`${o.name} ${o.employeeNo ?? ''}`}
                          onSelect={() => {
                            set('managerId', String(o.id));
                            setManagerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              form.managerId === String(o.id) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {o.name}
                          {o.employeeNo ? `（${o.employeeNo}）` : ''}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="僱用類型" required error={errors.employmentType}>
              <Select value={form.employmentType || undefined} onValueChange={v => set('employmentType', v)}>
                <SelectTrigger className={errors.employmentType ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['全職', '兼職', '合約', '實習'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="試用期（月）">
              <Input type="number" value={form.probation} onChange={e => set('probation', e.target.value)} />
            </Field>
            <Field label="通過試用日期">
              <Input
                type="date"
                value={form.probationPassDate}
                onChange={e => set('probationPassDate', e.target.value)}
                onClick={e => e.currentTarget.showPicker?.()}
              />
            </Field>
            <Field label="門市分類">
              <Select value={form.storeCategory || undefined} onValueChange={v => set('storeCategory', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['總部', '分店A', '分店B'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="打卡班次">
              <Select value={form.scheduleId || undefined} onValueChange={v => set('scheduleId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇班次')} />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map(sc => (
                    <SelectItem key={sc.id} value={String(sc.id)}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="薪資類型" required error={errors.salaryType}>
              <Select value={form.salaryType || undefined} onValueChange={v => set('salaryType', v)}>
                <SelectTrigger className={errors.salaryType ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_TYPES.map(o => (
                    <SelectItem key={o.code} value={o.code}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="基本薪金 (HK$)" required error={errors.baseSalary}>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={e => set('baseSalary', e.target.value)}
                placeholder="0"
                className={errors.baseSalary ? 'border-destructive' : ''}
              />
            </Field>
            <Field label="薪資方案">
              <Select value={form.salaryPlanId || undefined} onValueChange={handlePickPlan}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇薪資方案')} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="工資發放群組">
              <Select value={form.payrollGroup || undefined} onValueChange={v => set('payrollGroup', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['月結A組', '月結B組', '半月結'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="ADW 加班費倍數">
              <Input
                type="number"
                value={form.adwOvertime}
                onChange={e => set('adwOvertime', e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="銀行戶口比例（%）">
              <Input
                type="number"
                value={form.bankRatio}
                onChange={e => set('bankRatio', e.target.value)}
                placeholder="100"
              />
            </Field>
            <Field label="確認入職日期" required error={errors.joinDate}>
              <Input
                type="date"
                value={form.joinDate}
                onChange={e => set('joinDate', e.target.value)}
                onClick={e => e.currentTarget.showPicker?.()}
                className={errors.joinDate ? 'border-destructive' : ''}
              />
            </Field>
            <Field label="負責 HR">
              <Input value={currentUser?.userName || t('（當前登入用戶）')} readOnly />
            </Field>
            <Field label="供款類型">
              <Select value={form.contributionType || undefined} onValueChange={v => set('contributionType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['標準供款', '自願供款', '豁免'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="強積金類型">
              <Select value={form.mpfType || undefined} onValueChange={v => set('mpfType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['僱員強制', '僱主自願', '行業計劃'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="僱員強積金類型">
              <Select value={form.empMpfType || undefined} onValueChange={v => set('empMpfType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['標準', '特別'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="僱主強積金">
              <Input value={form.employerMpf} onChange={e => set('employerMpf', e.target.value)} />
            </Field>
            <Field label="公積金類型">
              <Select value={form.orsoType || undefined} onValueChange={v => set('orsoType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['僱員供款', '僱主供款', '雙方供款'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="僱員公積金比例（%）">
              <Input type="number" value={form.orsoEmpRatio} onChange={e => set('orsoEmpRatio', e.target.value)} />
            </Field>
            <Field label="僱主公積金比例（%）">
              <Input
                type="number"
                value={form.orsoEmployerRatio}
                onChange={e => set('orsoEmployerRatio', e.target.value)}
              />
            </Field>
            <Field label="僱主公積金">
              <Input value={form.employerOrso} onChange={e => set('employerOrso', e.target.value)} />
            </Field>
            <Field label="支付方式">
              <Select value={form.paymentType || undefined} onValueChange={v => set('paymentType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['銀行轉帳', '現金', '支票'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="備註">
            <Textarea
              value={form.remark}
              onChange={e => set('remark', e.target.value)}
              placeholder={t('其他需要注意的事項...')}
              rows={2}
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('取消')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            {t('提交並建立員工')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  children,
  error,
  label,
  required
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {t(label)} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
