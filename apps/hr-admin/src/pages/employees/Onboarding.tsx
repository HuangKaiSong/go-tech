import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Eye,
  ListChecks,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  UserPlus
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getTaskTemplates, LIFECYCLE_BIZ, type TaskTemplate } from '@/api/lifecycleTemplate';
import {
  createOnboarding,
  getOnboardingList,
  getOnboardingStatusCount,
  getPendingEmployees,
  type OnboardingItem,
  type PendingEmployee
} from '@/api/onboarding';
import { DataPagination } from '@/components/common/DataPagination';
import TaskTemplateTab from '@/components/employees/TaskTemplateTab';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { salaryTypeLabel } from '@/lib/salaryType';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { color: string; dot: string }> = {
  待入職: { color: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' },
  進行中: { color: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  資料待補: { color: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  已完成: { color: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  已取消: { color: 'bg-muted text-muted-foreground border-muted', dot: 'bg-muted-foreground' }
};

// 狀態下拉選項：value 為後端狀態碼
const statusOptions = [
  { value: 'all', label: '全部狀態' },
  { value: '1', label: '待入職' },
  { value: '2', label: '進行中' },
  { value: '3', label: '資料待補' },
  { value: '4', label: '已完成' },
  { value: '5', label: '已取消' }
];

/* ===== 新增入職 Dialog：從「待入職」員工選人建單 ===== */
function AddOnboardingDialog({
  onOpenChange,
  onSuccess,
  open,
  presetEmployeeId
}: {
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
  presetEmployeeId?: number | string | null;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // 待入職且未建單的員工
  const [pendingList, setPendingList] = useState<PendingEmployee[]>([]);
  const [empOpen, setEmpOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = pendingList.find(e => e.id === selectedId) || null;
  // 可填欄位
  const [source, setSource] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [mentor, setMentor] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  // 任務清單預覽：取自「任務模板」動態配置（僅顯示啟用項）
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const reset = () => {
    setStep(1);
    setSelectedId(null);
    setSource('');
    setPlanDate('');
    setMentor('');
    setRemark('');
    setError('');
  };

  // 打開時載入可建單員工 + 入職任務模板（用於第三步清單預覽）
  useEffect(() => {
    if (open) {
      getPendingEmployees()
        .then(res => {
          const list = res.data || [];
          setPendingList(list);
          // 從員工列表「辦理入職」跳轉而來時，自動預選該員工
          if (presetEmployeeId != null) {
            // 注意：EmployeeVO.id 經 ToStringSerializer 為字符串，PendingEmployeeVO.id 為數字，統一按字符串比較
            const emp = list.find(e => String(e.id) === String(presetEmployeeId));
            if (emp) {
              setSelectedId(emp.id);
              setPlanDate(emp.joinDate || '');
            } else {
              toast.error(t('該員工不在可建單的待入職名單中，可能已建立入職單'));
            }
          }
        })
        .catch(() => setPendingList([]));
      setTemplatesLoading(true);
      getTaskTemplates(LIFECYCLE_BIZ.ONBOARDING)
        .then(res => setTemplates(res.data || []))
        .catch(() => setTemplates([]))
        .finally(() => setTemplatesLoading(false));
    }
    // oxlint-disable-next-line react/exhaustive-deps
  }, [open, presetEmployeeId]);

  // 啟用項按 sort 排序後按分類分組（保持分類首次出現的順序）
  const taskGroups = (() => {
    const enabled = templates.filter(x => x.enabled === 1).toSorted((a, b) => a.sort - b.sort);
    const groups: { cat: string; items: TaskTemplate[] }[] = [];
    for (const tpl of enabled) {
      let g = groups.find(x => x.cat === tpl.category);
      if (!g) {
        g = { cat: tpl.category, items: [] };
        groups.push(g);
      }
      g.items.push(tpl);
    }
    return groups;
  })();

  const handleSelect = (emp: PendingEmployee) => {
    setSelectedId(emp.id);
    setPlanDate(emp.joinDate || '');
    setError('');
    setEmpOpen(false);
  };

  const handleNext = () => {
    if (step === 1 && !selected) {
      setError(t('請選擇員工'));
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await createOnboarding({
        employeeId: selected.id,
        planDate: planDate || undefined,
        source: source || undefined,
        mentor: mentor.trim() || undefined,
        remark: remark.trim() || undefined
      });
      toast.success(t('已為 {{name}} 建立入職流程', { name: selected.name }));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || t('建立失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('新增入職')}
          </DialogTitle>
          <DialogDescription>{t('從「待入職」員工中選擇，建立入職流程與任務清單')}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {['選擇員工', '入職安排', '任務清單'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  step > i + 1
                    ? 'bg-success text-success-foreground'
                    : step === i + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {t(s)}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Separator />

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">
                {t('員工姓名')} <span className="text-destructive">*</span>
              </Label>
              <Popover open={empOpen} onOpenChange={setEmpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn('w-full justify-between font-normal', error && 'border-destructive')}
                  >
                    <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                      {selected
                        ? `${selected.name}${selected.employeeNo ? `（${selected.employeeNo}）` : ''}`
                        : t('搜尋並選擇待入職員工')}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('輸入姓名/工號搜尋...')} />
                    <CommandList>
                      <CommandEmpty>{t('沒有可建單的待入職員工')}</CommandEmpty>
                      {pendingList.map(e => (
                        <CommandItem
                          key={e.id}
                          value={`${e.name} ${e.employeeNo ?? ''}`}
                          onSelect={() => handleSelect(e)}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedId === e.id ? 'opacity-100' : 'opacity-0')} />
                          {e.name}
                          {e.employeeNo ? `（${e.employeeNo}）` : ''}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            {/* 選中後回顯員工檔案信息（只讀） */}
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField label={t('聯絡電話')} value={selected?.phone} />
              <ReadonlyField label={t('電子郵箱')} value={selected?.email} />
              <ReadonlyField label={t('部門')} value={selected?.department} />
              <ReadonlyField label={t('職位')} value={selected?.position} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('招聘來源')}</Label>
              <Select value={source || undefined} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder={t('請選擇')} />
                </SelectTrigger>
                <SelectContent>
                  {['求職平台', '獵頭推薦', '校園招聘', '內部推薦', '社交媒體', '其他'].map(o => (
                    <SelectItem key={o} value={o}>
                      {t(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('預定入職日期')}</Label>
                <Input
                  type="date"
                  value={planDate}
                  onChange={e => setPlanDate(e.target.value)}
                  onClick={e => e.currentTarget.showPicker?.()}
                />
              </div>
              <ReadonlyField label={t('負責 HR')} value={selected?.hrOwnerName} />
              <ReadonlyField label={t('直屬主管')} value={selected?.managerName} />
              <div className="space-y-1.5">
                <Label className="text-sm">{t('入職導師')}</Label>
                <Input
                  placeholder={t('請輸入導師姓名（選填）')}
                  value={mentor}
                  onChange={e => setMentor(e.target.value)}
                />
              </div>
              <ReadonlyField
                label={t('試用期（月）')}
                value={selected?.probation != null ? String(selected.probation) : ''}
              />
              <ReadonlyField
                label={t('薪資類型')}
                value={selected?.salaryType ? t(salaryTypeLabel(selected.salaryType)) : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('備註')}</Label>
              <Textarea
                placeholder={t('其他需要注意的事項...')}
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{t('系統將自動建立以下入職任務清單，您可在建立後調整：')}</p>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t('載入中...')}
              </div>
            ) : taskGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t('尚未配置任務模板，建單時將使用內置默認清單')}
              </div>
            ) : (
              <div className="space-y-3">
                {taskGroups.map(g => (
                  <div key={g.cat} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground">{t(g.cat)}</p>
                      <span className="text-xs text-muted-foreground">{g.items.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {g.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          <span className="flex-1">{item.name}</span>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {item.assigneeType === 2 ? t('員工') : t('HR')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('取消')}
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              {t('上一步')}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>{t('下一步')}</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('確認建立')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 只讀回顯欄位（取自員工檔案，不可在此修改） */
function ReadonlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input value={value || ''} placeholder="—" readOnly className="bg-muted/50" />
    </div>
  );
}

/* ===== 統計卡片 ===== */
function StatCard({ accent, icon: Icon, label, value }: { accent: string; icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ===== 主頁面 ===== */
export default function Onboarding() {
  const [addOpen, setAddOpen] = useState(false);
  const [presetEmployeeId, setPresetEmployeeId] = useState<number | string | null>(null);
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [data, setData] = useState<OnboardingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 統計卡數量：{ 總數, 待入職, 進行中+資料待補, 已完成 }
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 從員工列表「辦理入職」跳轉：先判該員工是否仍在待入職名單，
  // 在名單才自動打開新增彈窗並預選；已建過入職單則不彈窗，直接停留在入職列表。
  // 隨後清除路由 state 避免刷新重觸發。
  useEffect(() => {
    const st = location.state as { employeeId?: number | string; openAdd?: boolean } | null;
    if (!st?.openAdd) return;
    const empId = st.employeeId ?? null;
    navigate(location.pathname, { replace: true, state: null });
    if (empId == null) {
      // 無指定員工：維持原「新增入職」行為
      setPresetEmployeeId(null);
      setAddOpen(true);
      return;
    }
    getPendingEmployees()
      .then(async res => {
        const inPending = (res.data || []).some(e => String(e.id) === String(empId));
        if (inPending) {
          setPresetEmployeeId(empId);
          setAddOpen(true);
          return;
        }
        // 已建立入職單：定位該員工的入職單並直接跳到其詳情
        try {
          const listRes = await getOnboardingList({ current: 1, size: 200 });
          const ticket = (listRes.data.records || []).find(it => String(it.employeeId) === String(empId));
          if (ticket) {
            navigate(`/employees/onboarding/${ticket.id}`);
          } else {
            // 兜底：找不到單（可能已取消/超出首頁）則停留在列表並提示
            toast.info(t('該員工已建立入職單，已為您開啟入職列表'));
          }
        } catch {
          toast.info(t('該員工已建立入職單，已為您開啟入職列表'));
        }
      })
      .catch(() => {
        // 查名單失敗時退回原行為，讓彈窗內自身校驗兜底
        setPresetEmployeeId(empId);
        setAddOpen(true);
      });
    // oxlint-disable-next-line react/exhaustive-deps
  }, [location.state]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrent(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOnboardingList({
        current,
        size,
        keyword: debouncedSearch || undefined,
        status: filterStatus === 'all' ? undefined : Number(filterStatus)
      });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || t('獲取入職單失敗'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [current, size, debouncedSearch, filterStatus]);

  // 統計卡：調 statusCount 接口一次取回各狀態數量
  const fetchStats = useCallback(async () => {
    try {
      const res = await getOnboardingStatusCount();
      const map: Record<number, number> = {};
      (res.data || []).forEach(row => {
        map[row.status] = row.cnt;
      });
      const get = (s: number) => map[s] ?? 0;
      setStats({
        // 總數含全部狀態（含資料待補/已取消）
        total: (res.data || []).reduce((sum, row) => sum + row.cnt, 0),
        pending: get(1),
        // 進行中卡片 = 進行中 + 資料待補
        inProgress: get(2) + get(3),
        completed: get(4)
      });
    } catch {
      setStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshAll = () => {
    fetchData();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          {t('入職管理')}
        </h1>
        <p className="page-description">{t('管理新員工的入職流程、任務追蹤與資料準備')}</p>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-1">
            <UserPlus className="h-3.5 w-3.5" />
            {t('入職單')}
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            {t('任務模板')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-6">
          {/* 工具列：新增入職 */}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('新增入職')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label={t('入職總數')} value={stats.total} icon={UserPlus} accent="bg-primary/10 text-primary" />
            <StatCard label={t('待入職')} value={stats.pending} icon={Clock} accent="bg-primary/10 text-primary" />
            <StatCard
              label={t('進行中')}
              value={stats.inProgress}
              icon={AlertCircle}
              accent="bg-warning/10 text-warning"
            />
            <StatCard
              label={t('已完成')}
              value={stats.completed}
              icon={CheckCircle2}
              accent="bg-success/10 text-success"
            />
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('搜尋單號、姓名、部門、職位...')}
                    className="pl-9 h-9"
                    name="onboarding-keyword-search"
                    autoComplete="off"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterStatus}
                    onValueChange={v => {
                      setFilterStatus(v);
                      setCurrent(1);
                    }}
                  >
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Loading state (first load) */}
              {loading && data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">{t('載入中...')}</p>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive font-medium mb-1">{t('載入失敗')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    {t('重新載入')}
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <UserPlus className="h-10 w-10 mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium mb-1">{t('暫無入職單')}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {debouncedSearch ? t('沒有符合搜尋條件的入職單') : t('尚未建立任何入職流程')}
                  </p>
                  {!debouncedSearch && (
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t('新增入職')}
                    </Button>
                  )}
                </div>
              )}

              {/* Data table */}
              {!error && data.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('員工')}</TableHead>
                        <TableHead>{t('部門 / 職位')}</TableHead>
                        <TableHead>{t('預定入職日')}</TableHead>
                        <TableHead>{t('負責 HR')}</TableHead>
                        <TableHead>{t('進度')}</TableHead>
                        <TableHead>{t('狀態')}</TableHead>
                        <TableHead className="w-20">{t('操作')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map(r => {
                        const sc = statusConfig[r.status];
                        return (
                          <TableRow
                            key={r.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/employees/onboarding/${r.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {(r.employeeName || '').slice(-2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{r.employeeName}</p>
                                  <p className="text-xs text-muted-foreground">{r.onboardingNo}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{r.department || '—'}</p>
                              <p className="text-xs text-muted-foreground">{r.position || '—'}</p>
                            </TableCell>
                            <TableCell className="text-sm">{r.planDate || '—'}</TableCell>
                            <TableCell className="text-sm">{r.hrOwnerName || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 w-28">
                                <Progress value={r.progress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground w-8">{r.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={sc?.color || ''}>
                                <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc?.dot || ''}`} />
                                {r.status ? t(r.status) : '—'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  navigate(`/employees/onboarding/${r.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Loading overlay when fetching next pages */}
                  {loading && data.length > 0 && (
                    <div className="flex items-center justify-center py-3 border-t">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs text-muted-foreground">{t('載入中...')}</span>
                    </div>
                  )}

                  <DataPagination
                    current={current}
                    pageSize={size}
                    total={total}
                    onChange={setCurrent}
                    onPageSizeChange={s => {
                      setSize(s);
                      setCurrent(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <TaskTemplateTab bizType={1} />
        </TabsContent>
      </Tabs>

      <AddOnboardingDialog
        open={addOpen}
        onOpenChange={v => {
          setAddOpen(v);
          if (!v) setPresetEmployeeId(null);
        }}
        onSuccess={refreshAll}
        presetEmployeeId={presetEmployeeId}
      />
    </div>
  );
}
