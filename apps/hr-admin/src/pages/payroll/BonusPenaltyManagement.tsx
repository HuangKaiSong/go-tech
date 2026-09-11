import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign, Plus, Search, TrendingUp, TrendingDown, Users, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import {
  getBonusPenaltyList, submitBonusPenalty, type BonusPenalty, type BonusPenaltySave,
} from "@/api/bonusPenalty";
import { getActiveEmployeeOptions } from "@/api/employee";

const TYPE_TEXT: Record<number, string> = { 1: "獎金", 2: "罰款" };
const STATUS_TEXT: Record<number, string> = { 1: "未計入", 2: "已計入", 3: "已取消" };

const bonusCategories = ["績效獎金", "專案獎金", "年終獎金", "推薦獎金", "全勤獎金", "其他獎金"];
const penaltyCategories = ["遲到罰款", "曠工罰款", "違規罰款", "損壞賠償", "其他罰款"];

const statusColors: Record<string, string> = {
  "未計入": "bg-warning/10 text-warning border-warning/20",
  "已計入": "bg-success/10 text-success border-success/20",
  "已取消": "bg-muted text-muted-foreground border-border",
};
const typeColors: Record<string, string> = {
  "獎金": "bg-success/10 text-success border-success/20",
  "罰款": "bg-destructive/10 text-destructive border-destructive/20",
};

interface FormData {
  type: string;       // "1" 獎金 / "2" 罰款
  category: string;
  employeeId: string;
  amount: string;
  applyMonth: string; // yyyy-MM
  reason: string;
  note: string;
}
const emptyForm: FormData = { type: "1", category: "", employeeId: "", amount: "", applyMonth: "", reason: "", note: "" };

export default function BonusPenaltyManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["bonusPenaltyList", search, typeFilter, statusFilter, monthFilter],
    queryFn: () => getBonusPenaltyList({
      keyword: search || undefined,
      type: typeFilter === "all" ? undefined : Number(typeFilter),
      status: statusFilter === "all" ? undefined : Number(statusFilter),
      applyMonth: monthFilter || undefined,
    }).then(r => r.data),
  });

  const { data: employeeOptions = [] } = useQuery({
    queryKey: ["activeEmployeeOptions"],
    queryFn: () => getActiveEmployeeOptions().then(r => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: BonusPenaltySave) => submitBonusPenalty(payload),
    onSuccess: () => {
      toast.success(t("已新增記錄"));
      queryClient.invalidateQueries({ queryKey: ["bonusPenaltyList"] });
      setForm(emptyForm);
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || t("新增失敗")),
  });

  const active = records.filter(r => r.status !== 3);
  const totalBonus = active.filter(r => r.type === 1).reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalPenalty = active.filter(r => r.type === 2).reduce((s, r) => s + Number(r.amount || 0), 0);
  const bonusCount = active.filter(r => r.type === 1).length;
  const penaltyCount = active.filter(r => r.type === 2).length;

  const stats = [
    { label: "獎金總額", value: `HK$ ${totalBonus.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
    { label: "罰款總額", value: `HK$ ${totalPenalty.toLocaleString()}`, icon: TrendingDown, color: "text-destructive" },
    { label: "獎金筆數", value: t("{{n}} 筆", { n: bonusCount }), icon: DollarSign, color: "text-primary" },
    { label: "罰款筆數", value: t("{{n}} 筆", { n: penaltyCount }), icon: Users, color: "text-warning" },
  ];

  const handleSubmit = () => {
    if (!form.employeeId || !form.amount || !form.applyMonth || !form.category || !form.reason) {
      toast.error(t("請填寫所有必填欄位"));
      return;
    }
    submitMutation.mutate({
      type: Number(form.type) as 1 | 2,
      category: form.category,
      employeeId: Number(form.employeeId),
      amount: Number(form.amount),
      applyMonth: form.applyMonth,
      reason: form.reason || undefined,
      note: form.note || undefined,
    });
  };

  const categories = form.type === "1" ? bonusCategories : penaltyCategories;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("獎金 / 罰款管理")}</h1>
          <p className="text-muted-foreground mt-1">{t("手動管理員工獎金與罰款，並指定計入的薪資月份")}</p>
        </div>
        {hasPerm(PAYROLL_PERM.BONUS_ADD) && (
          <Button className="gap-2" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />{t("新增獎金/罰款")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(s.label)}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("搜尋員工、部門、類別...")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder={t("類型")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部類型")}</SelectItem>
                <SelectItem value="1">{t("獎金")}</SelectItem>
                <SelectItem value="2">{t("罰款")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder={t("狀態")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部狀態")}</SelectItem>
                <SelectItem value="1">{t("未計入")}</SelectItem>
                <SelectItem value="2">{t("已計入")}</SelectItem>
                <SelectItem value="3">{t("已取消")}</SelectItem>
              </SelectContent>
            </Select>
            <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} className="w-[160px] cursor-pointer" />
            {(search || typeFilter !== "all" || statusFilter !== "all" || monthFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setMonthFilter(""); }}>
                {t("清除篩選")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("類型")}</TableHead>
                <TableHead>{t("類別")}</TableHead>
                <TableHead>{t("員工")}</TableHead>
                <TableHead>{t("部門")}</TableHead>
                <TableHead className="text-right">{t("金額")}</TableHead>
                <TableHead>{t("計入月份")}</TableHead>
                <TableHead>{t("原因")}</TableHead>
                <TableHead>{t("狀態")}</TableHead>
                <TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">{t("載入中...")}</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">{t("沒有符合條件的記錄")}</TableCell></TableRow>
              ) : (
                records.map((r: BonusPenalty) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/bonus-penalty/${r.id}`)}>
                    <TableCell><Badge variant="outline" className={typeColors[TYPE_TEXT[r.type]]}>{t(TYPE_TEXT[r.type])}</Badge></TableCell>
                    <TableCell className="text-sm">{t(r.category)}</TableCell>
                    <TableCell><p className="font-medium text-sm">{r.employeeName || `#${r.employeeId}`}</p></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.departmentName || "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${r.type === 1 ? "text-success" : "text-destructive"}`}>
                      {r.type === 1 ? "+" : "-"}{Number(r.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{r.applyMonth}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.reason || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[STATUS_TEXT[r.status]]}>{t(STATUS_TEXT[r.status])}</Badge></TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigate(`/payroll/bonus-penalty/${r.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> {t("查看")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("新增獎金 / 罰款")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("類型")} <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v, category: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("獎金")}</SelectItem>
                    <SelectItem value="2">{t("罰款")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("類別")} <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("選擇類別")} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("員工")} <span className="text-destructive">*</span></Label>
              <Select value={form.employeeId} onValueChange={v => setForm(prev => ({ ...prev, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("選擇員工")} /></SelectTrigger>
                <SelectContent>
                  {employeeOptions.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}{e.employeeNo ? `（${e.employeeNo}）` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("金額 (HK$)")} <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder={t("輸入金額")} value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("計入月份")} <span className="text-destructive">*</span></Label>
                <Input type="month" value={form.applyMonth} onChange={e => setForm(prev => ({ ...prev, applyMonth: e.target.value }))} onClick={e => e.currentTarget.showPicker?.()} className="cursor-pointer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("原因")} <span className="text-destructive">*</span></Label>
              <Textarea placeholder={t("請輸入獎金/罰款原因")} value={form.reason} onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{t("備註")}</Label>
              <Input placeholder={t("選填備註")} value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("取消")}</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>{t("確認新增")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
