import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, DollarSign, Users, Shield, Gift, Briefcase, Plus, Trash2,
  Landmark, Receipt, CreditCard, Calculator
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import {
  getPayrollPlanDetail, savePayrollPlan, type PlanItem, type PayrollPlanSave,
} from "@/api/payroll";

interface SalaryItem {
  id: string;
  name: string;
  type: "fixed" | "percentage";
  category: "earning" | "deduction";
  value: number;
  mpfIncluded: boolean; // 是否計入 MPF「有關入息」
  taxable: boolean;     // 是否計入應稅所得（多國稅基 / IR56）
  description: string;
}

/** 本地 UI 明細項 ↔ 後端 PlanItem 轉換 */
const toApiItem = (i: SalaryItem): PlanItem => ({
  name: i.name,
  category: i.category === "earning" ? 1 : 2,
  calcType: i.type === "fixed" ? 1 : 2,
  value: Number(i.value) || 0,
  mpfIncluded: i.mpfIncluded,
  taxable: i.taxable,
  description: i.description || undefined,
});

const fromApiItem = (i: PlanItem): SalaryItem => ({
  id: (i.id ?? Date.now() + Math.random()).toString(),
  name: i.name,
  type: i.calcType === 2 ? "percentage" : "fixed",
  category: i.category === 2 ? "deduction" : "earning",
  value: Number(i.value) || 0,
  mpfIncluded: i.mpfIncluded ?? true,
  taxable: i.taxable ?? true,
  description: i.description || "",
});

// 註：強積金 MPF / ORSO 屬法定退休金，由核算引擎依員工設定自動計算，不在方案內作為減項。
const defaultItems: SalaryItem[] = [
  { id: "1", name: "交通津貼", type: "fixed", category: "earning", value: 2000, mpfIncluded: true, taxable: true, description: "每月固定交通津貼" },
  { id: "2", name: "膳食津貼", type: "fixed", category: "earning", value: 2400, mpfIncluded: false, taxable: false, description: "每月固定膳食津貼（不計入有關入息）" },
  { id: "3", name: "技術加給", type: "fixed", category: "earning", value: 3000, mpfIncluded: true, taxable: true, description: "技術職加給" },
  { id: "4", name: "工會會費", type: "fixed", category: "deduction", value: 50, mpfIncluded: false, taxable: false, description: "每月工會會費" },
];

const REGIONS = ["香港", "中國", "台灣", "新加坡", "澳洲", "其他"];
const PAYMENT_METHODS = ["匯豐銀行轉帳", "FPS 轉數快", "支票", "現金"];
const num = (v: string | number) => Number(v) || 0;

export default function PayrollPlanForm() {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!planId;
  const planIdNum = planId ? Number(planId) : undefined;

  const [form, setForm] = useState({
    name: "",
    code: "",
    currency: "HKD",
    baseSalaryMin: "",
    baseSalaryMax: "",
    applicable: "",
    description: "",
    probationRatio: "80",
    overtimeBase: "hourly",
    includeBonus: true,
    // 退休金 / 退休金
    retireRegion: "香港",
    retireName: "強積金 MPF",
    retireEmpRate: "5",
    retireEmployerRate: "5",
    retireMin: "7100",
    retireMax: "30000",
    // 稅務規則
    taxRegion: "香港",
    taxType: "2", // 1累進 / 2固定比例 / 3免稅
    taxRate: "15",
    taxThreshold: "132000",
    // 支付設定
    paymentMethod: "匯豐銀行轉帳",
    payDay: "5",
  });

  const [items, setItems] = useState<SalaryItem[]>(isEdit ? [] : defaultItems);

  // 編輯：載入方案詳情並回填
  const { data: detail } = useQuery({
    queryKey: ["payrollPlanDetail", planIdNum],
    queryFn: () => getPayrollPlanDetail(planIdNum!).then(r => r.data),
    enabled: isEdit && !!planIdNum,
  });

  useEffect(() => {
    if (!detail) return;
    const s = (v: string | number | null | undefined, d = "") => (v != null && v !== "" ? String(v) : d);
    setForm(prev => ({
      ...prev,
      name: detail.name || "",
      code: detail.code || "",
      baseSalaryMin: detail.baseSalaryMin != null ? String(detail.baseSalaryMin) : "",
      baseSalaryMax: detail.baseSalaryMax != null ? String(detail.baseSalaryMax) : "",
      applicable: detail.applicable || "",
      description: detail.description || "",
      currency: detail.currency || prev.currency,
      probationRatio: s(detail.probationRatio, prev.probationRatio),
      overtimeBase: detail.overtimeBase || prev.overtimeBase,
      includeBonus: detail.includeBonus != null ? detail.includeBonus : prev.includeBonus,
      retireRegion: detail.retireRegion || prev.retireRegion,
      retireName: detail.retireName || prev.retireName,
      retireEmpRate: s(detail.retireEmpRate, prev.retireEmpRate),
      retireEmployerRate: s(detail.retireEmployerRate, prev.retireEmployerRate),
      retireMin: s(detail.retireMin, prev.retireMin),
      retireMax: s(detail.retireMax, prev.retireMax),
      taxRegion: detail.taxRegion || prev.taxRegion,
      taxType: s(detail.taxType, prev.taxType),
      taxRate: s(detail.taxRate, prev.taxRate),
      taxThreshold: s(detail.taxThreshold, prev.taxThreshold),
      paymentMethod: detail.paymentMethod || prev.paymentMethod,
      payDay: s(detail.payDay, prev.payDay),
    }));
    setItems((detail.items || []).map(fromApiItem));
  }, [detail]);

  const updateForm = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addItem = (category: "earning" | "deduction") => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      type: "fixed",
      category,
      value: 0,
      mpfIncluded: category === "earning",
      taxable: category === "earning",
      description: "",
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, key: keyof SalaryItem, value: string | number | boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: PayrollPlanSave) => savePayrollPlan(payload),
    onSuccess: () => {
      toast.success(isEdit ? t("已更新方案「{{name}}」", { name: form.name }) : t("已建立方案「{{name}}」", { name: form.name }));
      navigate("/payroll/structure");
    },
    onError: (e: Error) => toast.error(e.message || t("儲存失敗")),
  });

  const handleSave = () => {
    if (!form.name || !form.code) {
      toast.error(t("請填寫方案名稱與代碼"));
      return;
    }
    const payload: PayrollPlanSave = {
      id: planIdNum,
      name: form.name,
      code: form.code,
      baseSalaryMin: form.baseSalaryMin ? Number(form.baseSalaryMin) : undefined,
      baseSalaryMax: form.baseSalaryMax ? Number(form.baseSalaryMax) : undefined,
      applicable: form.applicable || undefined,
      description: form.description || undefined,
      // 新增默認啟用；編輯沿用方案原啟用狀態，避免把已停用方案改回啟用
      enabled: detail?.enabled ?? true,
      currency: form.currency || undefined,
      probationRatio: form.probationRatio ? Number(form.probationRatio) : undefined,
      overtimeBase: form.overtimeBase || undefined,
      includeBonus: form.includeBonus,
      retireRegion: form.retireRegion || undefined,
      retireName: form.retireName || undefined,
      retireEmpRate: form.retireEmpRate ? Number(form.retireEmpRate) : undefined,
      retireEmployerRate: form.retireEmployerRate ? Number(form.retireEmployerRate) : undefined,
      retireMin: form.retireMin ? Number(form.retireMin) : undefined,
      retireMax: form.retireMax ? Number(form.retireMax) : undefined,
      taxRegion: form.taxRegion || undefined,
      taxType: form.taxType ? Number(form.taxType) : undefined,
      taxRate: form.taxRate ? Number(form.taxRate) : undefined,
      taxThreshold: form.taxThreshold ? Number(form.taxThreshold) : undefined,
      paymentMethod: form.paymentMethod || undefined,
      payDay: form.payDay ? Number(form.payDay) : undefined,
      items: items.map(toApiItem),
    };
    saveMutation.mutate(payload);
  };

  const earnings = items.filter(i => i.category === "earning");
  const deductions = items.filter(i => i.category === "deduction");

  // 試算預覽（以最高基本薪資估算，純前端展示；正式計算由核算引擎按員工檔案跑）
  const preview = (() => {
    const base = num(form.baseSalaryMax);
    const allowance = earnings.reduce((s, i) => i.type === "fixed" ? s + num(i.value) : s, 0);
    const mpfIncludedAllow = earnings.reduce((s, i) => (i.type === "fixed" && i.mpfIncluded) ? s + num(i.value) : s, 0);
    const dedFixed = deductions.reduce((s, i) => i.type === "fixed" ? s + num(i.value) : s, 0);
    const mpfGross = base + mpfIncludedAllow;
    const min = num(form.retireMin), max = num(form.retireMax);
    let mpfBase = 0;
    if (mpfGross > 0 && mpfGross >= min) mpfBase = max > 0 ? Math.min(mpfGross, max) : mpfGross;
    const empMpf = Math.round(mpfBase * num(form.retireEmpRate) / 100);
    const erMpf = Math.round(mpfBase * num(form.retireEmployerRate) / 100);
    // 香港無 PAYE，稅款不從實發扣除；其餘地區且非免稅才估算月稅
    const withhold = form.taxRegion !== "香港" && form.taxType !== "3";
    const taxable = Math.max(0, base + allowance - num(form.taxThreshold) / 12);
    const monthlyTax = withhold ? Math.round(taxable * num(form.taxRate) / 100) : 0;
    const net = base + allowance - dedFixed - empMpf - monthlyTax;
    return { base, allowance, empMpf, erMpf, monthlyTax, net };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/payroll/structure")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? t("編輯薪資方案") : t("新增薪資方案")}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {isEdit ? t("編輯方案 {{name}}", { name: form.name }) : t("設定薪資結構與項目")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/payroll/structure")}>{t("取消")}</Button>
          {hasPerm(isEdit ? PAYROLL_PERM.PLAN_EDIT : PAYROLL_PERM.PLAN_ADD) && (
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />{t("儲存方案")}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />{t("基本資訊")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("方案名稱")} <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder={t("如：技術職等 A")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("方案代碼")} <span className="text-destructive">*</span></Label>
                  <Input value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder={t("如：TECH-A")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("方案說明")}</Label>
                <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder={t("描述此方案的適用範圍與特點...")} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("適用對象")}</Label>
                  <Input value={form.applicable} onChange={(e) => updateForm("applicable", e.target.value)} placeholder={t("如：高級工程師")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("薪資幣別")}</Label>
                  <Select value={form.currency} onValueChange={(v) => updateForm("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWD">{t("TWD - 新台幣")}</SelectItem>
                      <SelectItem value="USD">{t("USD - 美元")}</SelectItem>
                      <SelectItem value="CNY">{t("CNY - 人民幣")}</SelectItem>
                      <SelectItem value="JPY">{t("JPY - 日圓")}</SelectItem>
                      <SelectItem value="EUR">{t("EUR - 歐元")}</SelectItem>
                      <SelectItem value="GBP">{t("GBP - 英鎊")}</SelectItem>
                      <SelectItem value="HKD">{t("HKD - 港幣")}</SelectItem>
                      <SelectItem value="SGD">{t("SGD - 新加坡幣")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />{t("薪資範圍")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("最低基本薪資（{{currency}}）", { currency: form.currency })}</Label>
                  <Input type="number" value={form.baseSalaryMin} onChange={(e) => updateForm("baseSalaryMin", e.target.value)} placeholder="30000" />
                </div>
                <div className="space-y-2">
                  <Label>{t("最高基本薪資（{{currency}}）", { currency: form.currency })}</Label>
                  <Input type="number" value={form.baseSalaryMax} onChange={(e) => updateForm("baseSalaryMax", e.target.value)} placeholder="80000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("試用期薪資比例（%）")}</Label>
                  <Input type="number" value={form.probationRatio} onChange={(e) => updateForm("probationRatio", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("加班費計算基準")}</Label>
                  <Select value={form.overtimeBase} onValueChange={(v) => updateForm("overtimeBase", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{t("時薪制")}</SelectItem>
                      <SelectItem value="daily">{t("日薪制")}</SelectItem>
                      <SelectItem value="monthly">{t("月薪制")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-success" />{t("加項（津貼/補助）")}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addItem("earning")}>
                  <Plus className="h-3.5 w-3.5 mr-1" />{t("新增加項")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("尚未設定加項")}</p>
              ) : (
                <div className="space-y-3">
                  {earnings.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{t("項目名稱")}</Label>
                            <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder={t("項目名稱")} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("類型")}</Label>
                            <Select value={item.type} onValueChange={(v) => updateItem(item.id, "type", v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">{t("固定金額")}</SelectItem>
                                <SelectItem value="percentage">{t("百分比")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{item.type === "fixed" ? t("金額（{{currency}}）", { currency: form.currency }) : t("百分比（%）")}</Label>
                            <Input type="number" value={item.value} onChange={(e) => updateItem(item.id, "value", Number(e.target.value))} className="h-9" />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <Switch checked={item.mpfIncluded} onCheckedChange={(v) => updateItem(item.id, "mpfIncluded", v)} />
                            {t("計入 MPF 有關入息")}
                          </label>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <Switch checked={item.taxable} onCheckedChange={(v) => updateItem(item.id, "taxable", v)} />
                            {t("應稅（IR56）")}
                          </label>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 mt-5" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                {t("※ 強積金 MPF / ORSO 屬法定退休金，由核算引擎依員工檔案（供款類型、比例）自動計算，無需在此新增為減項。")}
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />{t("減項（扣除/保險）")}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addItem("deduction")}>
                  <Plus className="h-3.5 w-3.5 mr-1" />{t("新增減項")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("尚未設定減項")}</p>
              ) : (
                <div className="space-y-3">
                  {deductions.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("項目名稱")}</Label>
                          <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder={t("項目名稱")} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("類型")}</Label>
                          <Select value={item.type} onValueChange={(v) => updateItem(item.id, "type", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">{t("固定金額")}</SelectItem>
                              <SelectItem value="percentage">{t("百分比")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{item.type === "fixed" ? t("金額（{{currency}}）", { currency: form.currency }) : t("百分比（%）")}</Label>
                          <Input type="number" value={item.value} onChange={(e) => updateItem(item.id, "value", Number(e.target.value))} className="h-9" />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 mt-5" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 退休金 / 稅務 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />{t("退休金 / 稅務")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 強積金 / 退休金 */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5 text-muted-foreground" />{t("強積金 / 退休金")}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("適用地區")}</Label>
                    <Select value={form.retireRegion} onValueChange={(v) => updateForm("retireRegion", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{t(r)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("計劃名稱")}</Label>
                    <Input className="h-9" value={form.retireName} onChange={(e) => updateForm("retireName", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("員工供款率 (%)")}</Label>
                    <Input className="h-9" type="number" value={form.retireEmpRate} onChange={(e) => updateForm("retireEmpRate", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("僱主供款率 (%)")}</Label>
                    <Input className="h-9" type="number" value={form.retireEmployerRate} onChange={(e) => updateForm("retireEmployerRate", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("供款基數下限")}</Label>
                    <Input className="h-9" type="number" value={form.retireMin} onChange={(e) => updateForm("retireMin", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("供款基數上限")}</Label>
                    <Input className="h-9" type="number" value={form.retireMax} onChange={(e) => updateForm("retireMax", e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 稅務規則 */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />{t("稅務規則")}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("稅務地區")}</Label>
                    <Select value={form.taxRegion} onValueChange={(v) => updateForm("taxRegion", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{t(r)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("計稅方式")}</Label>
                    <Select value={form.taxType} onValueChange={(v) => updateForm("taxType", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t("累進")}</SelectItem>
                        <SelectItem value="2">{t("固定比例")}</SelectItem>
                        <SelectItem value="3">{t("免稅")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("稅率 (%)")}</Label>
                    <Input className="h-9" type="number" value={form.taxRate} onChange={(e) => updateForm("taxRate", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("起徵點")}</Label>
                    <Input className="h-9" type="number" value={form.taxThreshold} onChange={(e) => updateForm("taxThreshold", e.target.value)} />
                  </div>
                </div>
                {form.taxRegion === "香港" && (
                  <p className="text-xs text-muted-foreground">{t("※ 香港無 PAYE，稅款僅供資訊 / IR56 口徑，不從實發中扣除。")}</p>
                )}
              </div>

              {/* 試算預覽 */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground" />{t("試算預覽（以最高基本薪資估算）")}
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">{t("基本薪資")}</div><div className="font-mono">HKD {preview.base.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("津貼合計")}</div><div className="font-mono">HKD {preview.allowance.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("員工供款")}</div><div className="font-mono text-destructive">- {preview.empMpf.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("僱主供款")}</div><div className="font-mono text-primary">{preview.erMpf.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("預估稅款")}</div><div className="font-mono text-destructive">- {preview.monthlyTax.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("預估實發")}</div><div className="font-mono font-semibold">HKD {preview.net.toLocaleString()}</div></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 支付設定 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />{t("支付設定")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("預設支付方式")}</Label>
                  <Select value={form.paymentMethod} onValueChange={(v) => updateForm("paymentMethod", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{t(m)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("發薪日（每月）")}</Label>
                  <Input type="number" min={1} max={31} value={form.payDay} onChange={(e) => updateForm("payDay", e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("員工資料中若另有指定支付方式，將優先於方案預設值。")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("方案預覽")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("基本薪資")}</span>
                  <span className="font-medium text-foreground">
                    {form.baseSalaryMin && form.baseSalaryMax
                      ? `${Number(form.baseSalaryMin).toLocaleString()} ~ ${Number(form.baseSalaryMax).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <Separator />
                <p className="text-xs font-medium text-success">{t("加項")}</p>
                {earnings.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.name || t("未命名")}</span>
                    <span className="text-foreground">{i.type === "fixed" ? `${form.currency} ${i.value.toLocaleString()}` : `${i.value}%`}</span>
                  </div>
                ))}
                <Separator />
                <p className="text-xs font-medium text-warning">{t("減項")}</p>
                {deductions.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.name || t("未命名")}</span>
                    <span className="text-foreground">{i.type === "fixed" ? `${form.currency} ${i.value.toLocaleString()}` : `${i.value}%`}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("其他設定")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("含年終獎金")}</p>
                  <p className="text-xs text-muted-foreground">{t("是否適用年終獎金計算")}</p>
                </div>
                <Switch checked={form.includeBonus} onCheckedChange={(v) => updateForm("includeBonus", v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
