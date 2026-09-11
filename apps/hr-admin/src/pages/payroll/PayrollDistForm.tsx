import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Search, DollarSign, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import { getGeneratableCalcBatches, generateDist, submitDist } from "@/api/payrollDist";
import { getCalcBatchDetail } from "@/api/payrollCalc";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { UnsavedBadge } from "@/components/UnsavedBadge";

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();
/** yyyy-MM → yyyy年MM月 */
const fmtPeriod = (p?: string | null) => {
  if (!p) return "—";
  const m = /^(\d{4})-(\d{2})/.exec(p);
  return m ? `${m[1]}年${m[2]}月` : p;
};

const PAY_METHODS = ["銀行轉帳", "自動轉帳（Autopay）", "支票", "現金"];
const PAY_BANKS = ["匯豐銀行", "恒生銀行", "中銀香港", "渣打銀行", "東亞銀行", "花旗銀行"];

export default function PayrollDistForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [calcBatchId, setCalcBatchId] = useState<string>("");
  const [payDate, setPayDate] = useState("");
  const [payMethod, setPayMethod] = useState("銀行轉帳");
  const [payBank, setPayBank] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  const { isDirty, markSaved, confirmLeave } = useUnsavedChanges({
    calcBatchId, payDate, payMethod, payBank, note, excluded: Array.from(excluded).sort(),
  });
  const leave = () => { if (confirmLeave()) navigate(-1); };

  const { data: calcBatches = [] } = useQuery({
    queryKey: ["generatableCalc"],
    queryFn: async () => (await getGeneratableCalcBatches()).data ?? [],
  });

  const selectedBatchId = calcBatchId ? Number(calcBatchId) : 0;
  const { data: detail } = useQuery({
    queryKey: ["calcBatchDetail", selectedBatchId],
    queryFn: async () => (await getCalcBatchDetail(selectedBatchId)).data,
    enabled: !!selectedBatchId,
  });

  const items = detail?.items ?? [];
  const period = detail?.batch?.period ?? calcBatches.find(b => b.id === selectedBatchId)?.period ?? null;

  const filtered = items.filter(e =>
    (e.employeeName || "").includes(search) ||
    (e.employeeNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.departmentName || "").includes(search)
  );
  const selectedItems = items.filter(i => !excluded.has(i.employeeId));
  const totalNet = selectedItems.reduce((s, e) => s + e.netSalary, 0);

  const toggleOne = (id: number) => setExcluded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSelected = items.length > 0 && excluded.size === 0;
  const toggleAll = (checked: boolean) => setExcluded(checked ? new Set() : new Set(items.map(i => i.employeeId)));

  // 校驗：核算批次、發薪日期、發薪方式、發薪銀行 皆必填，且至少 1 人
  const validate = (): string | null => {
    if (!selectedBatchId) return t("請選擇薪資期間（核算批次）");
    if (!payDate) return t("請選擇發薪日期");
    if (!payMethod) return t("請選擇發薪方式");
    if (!payBank) return t("請選擇發薪銀行");
    if (selectedItems.length === 0) return t("請至少勾選一位發薪對象");
    return null;
  };

  const submitM = useMutation({
    mutationFn: async (submitAfter: boolean) => {
      const res = await generateDist({
        calcBatchId: selectedBatchId,
        payDate,
        payMethod,
        payBank,
        employeeIds: items.filter(i => !excluded.has(i.employeeId)).map(i => i.employeeId),
        note: note || undefined,
      });
      const id = res.data as number;
      if (submitAfter && id) {
        await submitDist(id);
      }
      return { id, submitAfter };
    },
    onSuccess: ({ id, submitAfter }) => {
      markSaved();
      toast.success(submitAfter ? t("發薪批次已建立並提交審核") : t("發薪批次已儲存為草稿"));
      navigate(id ? `/payroll/distribute/${id}` : "/payroll/distribute");
    },
    onError: (e: any) => toast.error(e?.message || t("操作失敗")),
  });

  const run = (submitAfter: boolean) => {
    const err = validate();
    if (err) { toast.error(err); return; }
    submitM.mutate(submitAfter);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={leave}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{t("新增發薪批次")}</h1>
              <UnsavedBadge show={isDirty} />
            </div>
            <p className="text-muted-foreground mt-1">{t("建立新的發薪批次並設定發放資訊")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={leave}>{t("取消")}</Button>
          {hasPerm(PAYROLL_PERM.DIST_GENERATE) && (
            <Button variant="outline" className="gap-2" disabled={submitM.isPending} onClick={() => run(false)}>
              <Save className="h-4 w-4" /> {t("儲存草稿")}
            </Button>
          )}
          {hasPerm(PAYROLL_PERM.DIST_GENERATE) && (
            <Button className="gap-2" disabled={submitM.isPending} onClick={() => run(true)}>
              <Send className="h-4 w-4" /> {t("儲存並提交審核")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("發薪設定")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("薪資期間")} <span className="text-destructive">*</span></Label>
                <Select value={calcBatchId} onValueChange={v => { setCalcBatchId(v); setExcluded(new Set()); }}>
                  <SelectTrigger><SelectValue placeholder={t("選擇已確認的核算月份")} /></SelectTrigger>
                  <SelectContent>
                    {calcBatches.map(b => <SelectItem key={b.id} value={String(b.id)}>{fmtPeriod(b.period)}（{t("{{n}} 人", { n: b.employeeCount })} · {t("實發")} {num(b.totalNet)}）</SelectItem>)}
                  </SelectContent>
                </Select>
                {calcBatches.length === 0 && <p className="text-xs text-muted-foreground">{t("沒有可生成發放的核算批次，請先在「薪資計算」確認批次。")}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("發薪日期")} <span className="text-destructive">*</span></Label>
                <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("發薪方式")} <span className="text-destructive">*</span></Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue placeholder={t("選擇發薪方式")} /></SelectTrigger>
                  <SelectContent>{PAY_METHODS.map(m => <SelectItem key={m} value={m}>{t(m)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("發薪銀行")} <span className="text-destructive">*</span></Label>
                <Select value={payBank} onValueChange={setPayBank}>
                  <SelectTrigger><SelectValue placeholder={t("選擇發薪銀行")} /></SelectTrigger>
                  <SelectContent>{PAY_BANKS.map(b => <SelectItem key={b} value={b}>{t(b)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("備註")}</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t("輸入備註...")} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{t("發薪摘要")}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("發薪期間")}</span><span className="font-medium">{fmtPeriod(period)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("發薪日期")}</span><span className="font-medium">{payDate || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("發薪方式")}</span><span className="font-medium">{payMethod ? t(payMethod) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("發薪銀行")}</span><span className="font-medium">{payBank ? t(payBank) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("選取人數")}</span><span className="font-medium">{selectedItems.length} / {t("{{n}} 人", { n: items.length })}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold text-base"><span>{t("實發總額")}</span><span className="text-primary">HK$ {num(totalNet)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("發薪人員名單")}</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("搜尋員工...")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={c => toggleAll(!!c)} /></TableHead>
                    <TableHead>{t("員工")}</TableHead>
                    <TableHead>{t("部門")}</TableHead>
                    <TableHead>{t("職位")}</TableHead>
                    <TableHead>{t("銀行")}</TableHead>
                    <TableHead>{t("帳號")}</TableHead>
                    <TableHead className="text-right">{t("實發金額")}</TableHead>
                    <TableHead>{t("狀態")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(emp => {
                    const on = !excluded.has(emp.employeeId);
                    return (
                      <TableRow key={emp.employeeId} className={on ? "" : "opacity-50"}>
                        <TableCell><Checkbox checked={on} onCheckedChange={() => toggleOne(emp.employeeId)} /></TableCell>
                        <TableCell>
                          <div><p className="font-medium">{emp.employeeName}</p><p className="text-xs text-muted-foreground">{emp.employeeNo}</p></div>
                        </TableCell>
                        <TableCell>{emp.departmentName}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{emp.bankName ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{emp.bankAccount ?? "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{num(emp.netSalary)}</TableCell>
                        <TableCell>
                          {on
                            ? <Badge variant="outline" className="bg-success/10 text-success border-success/20">{t("已選取")}</Badge>
                            : <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{t("未選取")}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{t("請先選擇薪資期間")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
