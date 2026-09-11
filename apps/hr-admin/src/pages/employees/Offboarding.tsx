import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserMinus, Plus, Search, Eye, Clock, CheckCircle2, AlertCircle,
  Loader2, RotateCcw, Check, ChevronsUpDown, ListChecks,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskTemplateTab from "@/components/employees/TaskTemplateTab";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/DataPagination";
import type { PendingEmployee } from "@/api/onboarding";
import {
  getOffboardingList, getOffboardingStatusCount, getActiveEmployees, createOffboarding,
  OffboardingItem,
} from "@/api/offboarding";

const statusConfig: Record<string, { color: string; dot: string }> = {
  "待審批": { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  "交接中": { color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  "待結算": { color: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  "已完成": { color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  "已取消": { color: "bg-muted text-muted-foreground border-muted", dot: "bg-muted-foreground" },
};

// 狀態下拉選項：value 為後端狀態碼
const statusOptions = [
  { value: "all", label: "全部狀態" },
  { value: "1", label: "待審批" },
  { value: "2", label: "交接中" },
  { value: "3", label: "待結算" },
  { value: "4", label: "已完成" },
  { value: "5", label: "已取消" },
];

// 離職類型：code 對齊後端 LeaveTypeEnum
const leaveTypeOptions = [
  { value: "1", label: "主動離職" },
  { value: "2", label: "公司辭退" },
  { value: "3", label: "合同到期" },
  { value: "4", label: "退休" },
  { value: "5", label: "其他" },
];

const leaveReasonOptions = ["個人因素", "職涯發展", "薪資待遇", "工作環境", "家庭因素", "健康因素", "轉職", "其他"];

/* ===== 新增離職 Dialog：從「在職」員工選人建單 ===== */
function AddOffboardingDialog({ open, onOpenChange, onSuccess, presetEmployeeId }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSuccess?: () => void; presetEmployeeId?: number | string | null;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // 在職且未建離職單的員工（離職人選 + 交接人選共用）
  const [activeList, setActiveList] = useState<PendingEmployee[]>([]);
  const [empOpen, setEmpOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = activeList.find((e) => e.id === selectedId) || null;
  // 交接人
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverToId, setHandoverToId] = useState<number | null>(null);
  const handover = activeList.find((e) => e.id === handoverToId) || null;
  // 可填欄位
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [applyDate, setApplyDate] = useState("");
  const [lastWorkDate, setLastWorkDate] = useState("");
  // 第一期僅 UI 展示，不存入資料庫
  const [nonCompete, setNonCompete] = useState("");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setStep(1); setSelectedId(null); setHandoverToId(null);
    setLeaveType(""); setLeaveReason(""); setApplyDate(""); setLastWorkDate("");
    setNonCompete(""); setRemark(""); setErrors({});
  };

  // 打開時載入可建單員工
  useEffect(() => {
    if (open) {
      getActiveEmployees()
        .then((res) => {
          const list = res.data || [];
          setActiveList(list);
          // 從員工列表「辦理離職」跳轉而來時，自動預選該員工
          if (presetEmployeeId != null) {
            // 注意：EmployeeVO.id 經 ToStringSerializer 為字符串，PendingEmployeeVO.id 為數字，統一按字符串比較
            const emp = list.find((e) => String(e.id) === String(presetEmployeeId));
            if (!emp) { toast.error(t("該員工不在可建單的在職名單中，可能已建立離職單")); }
            else { setSelectedId(emp.id); }
          }
        })
        .catch(() => setActiveList([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetEmployeeId]);

  const handleNext = () => {
    if (step === 1) {
      const errs: Record<string, string> = {};
      if (!selected) errs.employee = t("請選擇員工");
      if (!leaveType) errs.leaveType = t("請選擇離職類型");
      if (!leaveReason) errs.leaveReason = t("請選擇離職原因");
      if (!applyDate) errs.applyDate = t("請選擇提出離職日期");
      if (!lastWorkDate) errs.lastWorkDate = t("請選擇預定最後工作日");
      if (applyDate && lastWorkDate && lastWorkDate < applyDate) {
        errs.lastWorkDate = t("最後工作日不能早於提出離職日期");
      }
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await createOffboarding({
        employeeId: selected.id,
        leaveType: Number(leaveType),
        leaveReason,
        applyDate,
        lastWorkDate,
        handoverToId: handoverToId ?? undefined,
        remark: remark.trim() || undefined,
      });
      toast.success(t("已為 {{name}} 建立離職流程，員工已轉「待離職」", { name: selected.name }));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || t("建立失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-destructive" />
            {t("新增離職")}
          </DialogTitle>
          <DialogDescription>{t("從「在職」員工中選擇，建立離職流程與交接任務清單")}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {["離職資訊", "交接安排", "任務清單"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{t(s)}</span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Separator />

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("員工姓名")} <span className="text-destructive">*</span></Label>
              <Popover open={empOpen} onOpenChange={setEmpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between font-normal", errors.employee && "border-destructive")}
                  >
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                      {selected ? `${selected.name}${selected.employeeNo ? `（${selected.employeeNo}）` : ""}` : t("搜尋並選擇在職員工")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("輸入姓名/工號搜尋...")} />
                    <CommandList>
                      <CommandEmpty>{t("沒有可建單的在職員工")}</CommandEmpty>
                      {activeList.map((e) => (
                        <CommandItem
                          key={e.id}
                          value={`${e.name} ${e.employeeNo ?? ""}`}
                          onSelect={() => {
                            setSelectedId(e.id);
                            // 離職者不能同時是交接人
                            if (handoverToId === e.id) setHandoverToId(null);
                            setErrors((prev) => ({ ...prev, employee: "" }));
                            setEmpOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedId === e.id ? "opacity-100" : "opacity-0")} />
                          {e.name}{e.employeeNo ? `（${e.employeeNo}）` : ""}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.employee && <p className="text-xs text-destructive">{errors.employee}</p>}
            </div>

            {/* 選中後回顯員工檔案信息（只讀） */}
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField label={t("部門")} value={selected?.department} />
              <ReadonlyField label={t("職位")} value={selected?.position} />
              <ReadonlyField label={t("聯絡電話")} value={selected?.phone} />
              <ReadonlyField label={t("電子郵箱")} value={selected?.email} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">{t("離職類型")} <span className="text-destructive">*</span></Label>
                <Select value={leaveType || undefined} onValueChange={(v) => { setLeaveType(v); setErrors((p) => ({ ...p, leaveType: "" })); }}>
                  <SelectTrigger className={cn(errors.leaveType && "border-destructive")}><SelectValue placeholder={t("請選擇")} /></SelectTrigger>
                  <SelectContent>
                    {leaveTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leaveType && <p className="text-xs text-destructive">{errors.leaveType}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t("離職原因")} <span className="text-destructive">*</span></Label>
                <Select value={leaveReason || undefined} onValueChange={(v) => { setLeaveReason(v); setErrors((p) => ({ ...p, leaveReason: "" })); }}>
                  <SelectTrigger className={cn(errors.leaveReason && "border-destructive")}><SelectValue placeholder={t("請選擇")} /></SelectTrigger>
                  <SelectContent>
                    {leaveReasonOptions.map((o) => (
                      <SelectItem key={o} value={o}>{t(o)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leaveReason && <p className="text-xs text-destructive">{errors.leaveReason}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t("提出離職日期")} <span className="text-destructive">*</span></Label>
                <Input type="date" value={applyDate} className={cn(errors.applyDate && "border-destructive")}
                  onChange={(e) => { setApplyDate(e.target.value); setErrors((p) => ({ ...p, applyDate: "" })); }}
                  onClick={(e) => e.currentTarget.showPicker?.()} />
                {errors.applyDate && <p className="text-xs text-destructive">{errors.applyDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t("預定最後工作日")} <span className="text-destructive">*</span></Label>
                <Input type="date" value={lastWorkDate} className={cn(errors.lastWorkDate && "border-destructive")}
                  onChange={(e) => { setLastWorkDate(e.target.value); setErrors((p) => ({ ...p, lastWorkDate: "" })); }}
                  onClick={(e) => e.currentTarget.showPicker?.()} />
                {errors.lastWorkDate && <p className="text-xs text-destructive">{errors.lastWorkDate}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField label={t("負責 HR")} value={selected?.hrOwnerName} />
              <ReadonlyField label={t("直屬主管")} value={selected?.managerName} />
              <div className="space-y-1.5">
                <Label className="text-sm">{t("交接人")}</Label>
                <Popover open={handoverOpen} onOpenChange={setHandoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
                      <span className={cn("truncate", !handover && "text-muted-foreground")}>
                        {handover ? `${handover.name}${handover.employeeNo ? `（${handover.employeeNo}）` : ""}` : t("搜尋並選擇交接人（選填）")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("輸入姓名/工號搜尋...")} />
                      <CommandList>
                        <CommandEmpty>{t("沒有可選的在職員工")}</CommandEmpty>
                        {activeList.filter((e) => e.id !== selectedId).map((e) => (
                          <CommandItem
                            key={e.id}
                            value={`${e.name} ${e.employeeNo ?? ""}`}
                            onSelect={() => {
                              setHandoverToId(handoverToId === e.id ? null : e.id);
                              setHandoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", handoverToId === e.id ? "opacity-100" : "opacity-0")} />
                            {e.name}{e.employeeNo ? `（${e.employeeNo}）` : ""}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t("是否需要競業禁止")}</Label>
                <Select value={nonCompete || undefined} onValueChange={setNonCompete}>
                  <SelectTrigger><SelectValue placeholder={t("請選擇（選填）")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("是")}</SelectItem>
                    <SelectItem value="no">{t("否")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("備註")}</Label>
              <Textarea placeholder={t("其他需要注意的事項...")} rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{t("系統將自動建立以下離職任務清單，您可在建立後調整：")}</p>
            <div className="space-y-3">
              {[
                { cat: "審批流程", items: ["離職申請審批", "部門主管確認", "HR 審核"] },
                { cat: "工作交接", items: ["工作內容交接文件", "客戶/專案交接", "未完成工作確認"] },
                { cat: "資產歸還", items: ["電腦設備歸還", "門禁卡歸還", "辦公用品歸還", "公司資料清理"] },
                { cat: "帳號權限", items: ["系統帳號停用", "郵箱設定轉發", "VPN/遠端權限關閉"] },
                { cat: "薪資結算", items: ["剩餘年假結算", "最後薪資計算", "社保公積金停繳", "離職證明開立"] },
                { cat: "離職面談", items: ["離職面談安排", "離職問卷填寫"] },
              ].map((g) => (
                <div key={g.cat} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{t(g.cat)}</p>
                  <div className="space-y-1.5">
                    {g.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {t(item)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("取消")}</Button>
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>{t("上一步")}</Button>}
          {step < 3 ? (
            <Button onClick={handleNext}>{t("下一步")}</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t("確認建立")}
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
      <Input value={value || ""} placeholder="—" readOnly className="bg-muted/50" />
    </div>
  );
}

/* ===== 統計卡片 ===== */
function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
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
export default function Offboarding() {
  const [addOpen, setAddOpen] = useState(false);
  const [presetEmployeeId, setPresetEmployeeId] = useState<number | string | null>(null);
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [data, setData] = useState<OffboardingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 統計卡數量：{ 總數, 待審批, 交接中+待結算, 已完成 }
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 從員工列表「辦理離職」跳轉：自動打開新增彈窗並預選該員工；隨後清除路由 state 避免刷新重觸發
  useEffect(() => {
    const st = location.state as { openAdd?: boolean; employeeId?: number | string } | null;
    if (st?.openAdd) {
      setPresetEmployeeId(st.employeeId ?? null);
      setAddOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setError("");
    try {
      const res = await getOffboardingList({
        current,
        size,
        keyword: debouncedSearch || undefined,
        status: filterStatus === "all" ? undefined : Number(filterStatus),
      });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || t("獲取離職單失敗"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [current, size, debouncedSearch, filterStatus]);

  // 統計卡：調 statusCount 接口一次取回各狀態數量
  const fetchStats = useCallback(async () => {
    try {
      const res = await getOffboardingStatusCount();
      const map: Record<number, number> = {};
      (res.data || []).forEach((row) => { map[row.status] = row.cnt; });
      const get = (s: number) => map[s] ?? 0;
      setStats({
        // 總數含全部狀態（含待結算/已取消）
        total: (res.data || []).reduce((sum, row) => sum + row.cnt, 0),
        pending: get(1),
        // 處理中卡片 = 交接中 + 待結算
        inProgress: get(2) + get(3),
        completed: get(4),
      });
    } catch {
      setStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const refreshAll = () => { fetchData(); fetchStats(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <UserMinus className="h-6 w-6 text-destructive" />
          {t("離職管理")}
        </h1>
        <p className="page-description">{t("管理員工離職流程、工作交接與薪資結算")}</p>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-1">
            <UserMinus className="h-3.5 w-3.5" />{t("離職單")}
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-1">
            <ListChecks className="h-3.5 w-3.5" />{t("任務模板")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-6">
          {/* 工具列：新增離職 */}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("新增離職")}
            </Button>
          </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("離職總數")} value={stats.total} icon={UserMinus} accent="bg-destructive/10 text-destructive" />
        <StatCard label={t("待審批")} value={stats.pending} icon={Clock} accent="bg-primary/10 text-primary" />
        <StatCard label={t("處理中")} value={stats.inProgress} icon={AlertCircle} accent="bg-warning/10 text-warning" />
        <StatCard label={t("已完成")} value={stats.completed} icon={CheckCircle2} accent="bg-success/10 text-success" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("搜尋單號、姓名、部門、職位...")} className="pl-9 h-9"
                name="offboarding-keyword-search" autoComplete="off"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrent(1); }}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{t(opt.label)}</SelectItem>
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
              <p className="text-sm">{t("載入中...")}</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium mb-1">{t("載入失敗")}</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />{t("重新載入")}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserMinus className="h-10 w-10 mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-1">{t("暫無離職單")}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {debouncedSearch ? t("沒有符合搜尋條件的離職單") : t("尚未建立任何離職流程")}
              </p>
              {!debouncedSearch && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />{t("新增離職")}
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
                    <TableHead>{t("員工")}</TableHead>
                    <TableHead>{t("部門 / 職位")}</TableHead>
                    <TableHead>{t("離職類型")}</TableHead>
                    <TableHead>{t("最後工作日")}</TableHead>
                    <TableHead>{t("負責 HR")}</TableHead>
                    <TableHead>{t("進度")}</TableHead>
                    <TableHead>{t("狀態")}</TableHead>
                    <TableHead className="w-20">{t("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => {
                    const sc = statusConfig[r.status];
                    return (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/employees/offboarding/${r.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-destructive/10 text-destructive text-xs font-medium">{(r.employeeName || "").slice(-2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{r.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{r.offboardingNo}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{r.department || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.position || "—"}</p>
                        </TableCell>
                        <TableCell className="text-sm">{r.leaveTypeName ? t(r.leaveTypeName) : "—"}</TableCell>
                        <TableCell className="text-sm">{r.lastWorkDate || "—"}</TableCell>
                        <TableCell className="text-sm">{r.hrOwnerName || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-28">
                            <Progress value={r.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{r.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={sc?.color || ""}>
                            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc?.dot || ""}`} />
                            {r.status ? t(r.status) : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/employees/offboarding/${r.id}`); }}>
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
                  <span className="text-xs text-muted-foreground">{t("載入中...")}</span>
                </div>
              )}

              <DataPagination
                current={current}
                pageSize={size}
                total={total}
                onChange={setCurrent}
                onPageSizeChange={(s) => { setSize(s); setCurrent(1); }}
              />
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <TaskTemplateTab bizType={2} />
        </TabsContent>
      </Tabs>

      <AddOffboardingDialog
        open={addOpen}
        onOpenChange={(v) => { setAddOpen(v); if (!v) setPresetEmployeeId(null); }}
        onSuccess={refreshAll}
        presetEmployeeId={presetEmployeeId}
      />
    </div>
  );
}
