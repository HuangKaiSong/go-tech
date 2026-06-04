import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, DollarSign, Users, Shield, Gift, Briefcase, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { mockPlans, type PayrollPlan } from "./PayrollStructure";

interface SalaryItem {
  id: string;
  name: string;
  type: "fixed" | "percentage";
  category: "earning" | "deduction";
  value: number;
  description: string;
}

const defaultItems: SalaryItem[] = [
  { id: "1", name: "交通補助", type: "fixed", category: "earning", value: 2000, description: "每月固定交通補助" },
  { id: "2", name: "伙食津貼", type: "fixed", category: "earning", value: 2400, description: "每月固定伙食津貼" },
  { id: "3", name: "勞保", type: "percentage", category: "deduction", value: 11, description: "勞工保險費用（雇主+員工）" },
  { id: "4", name: "健保", type: "percentage", category: "deduction", value: 5.17, description: "全民健康保險費" },
  { id: "5", name: "勞退提撥", type: "percentage", category: "deduction", value: 6, description: "勞工退休金提撥" },
];

export default function PayrollPlanForm() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!planId;
  const existingPlan = isEdit ? mockPlans.find(p => p.id === planId) : null;

  const [form, setForm] = useState({
    name: existingPlan?.name || "",
    code: existingPlan?.code || "",
    currency: "HKD",
    baseSalaryMin: existingPlan?.baseSalaryMin?.toString() || "",
    baseSalaryMax: existingPlan?.baseSalaryMax?.toString() || "",
    applicable: existingPlan?.applicable || "",
    description: existingPlan?.description || "",
    probationRatio: "80",
    overtimeBase: "hourly",
    includeBonus: true,
  });

  const [items, setItems] = useState<SalaryItem[]>(defaultItems);

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
      description: "",
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, key: keyof SalaryItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  const handleSave = () => {
    if (!form.name || !form.code) {
      toast.error("請填寫方案名稱與代碼");
      return;
    }
    toast.success(isEdit ? `已更新方案「${form.name}」` : `已建立方案「${form.name}」`);
    navigate("/payroll/structure");
  };

  const earnings = items.filter(i => i.category === "earning");
  const deductions = items.filter(i => i.category === "deduction");

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
              {isEdit ? "編輯薪資方案" : "新增薪資方案"}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {isEdit ? `編輯方案 ${existingPlan?.name}` : "設定薪資結構與項目"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/payroll/structure")}>取消</Button>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />儲存方案</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>方案名稱 <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="如：技術職等 A" />
                </div>
                <div className="space-y-2">
                  <Label>方案代碼 <span className="text-destructive">*</span></Label>
                  <Input value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="如：TECH-A" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>方案說明</Label>
                <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="描述此方案的適用範圍與特點..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>適用對象</Label>
                  <Input value={form.applicable} onChange={(e) => updateForm("applicable", e.target.value)} placeholder="如：高級工程師" />
                </div>
                <div className="space-y-2">
                  <Label>薪資幣別</Label>
                  <Select value={form.currency} onValueChange={(v) => updateForm("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWD">TWD - 新台幣</SelectItem>
                      <SelectItem value="USD">USD - 美元</SelectItem>
                      <SelectItem value="CNY">CNY - 人民幣</SelectItem>
                      <SelectItem value="JPY">JPY - 日圓</SelectItem>
                      <SelectItem value="EUR">EUR - 歐元</SelectItem>
                      <SelectItem value="GBP">GBP - 英鎊</SelectItem>
                      <SelectItem value="HKD">HKD - 港幣</SelectItem>
                      <SelectItem value="SGD">SGD - 新加坡幣</SelectItem>
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
                <DollarSign className="h-4 w-4 text-primary" />薪資範圍
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最低基本薪資（{form.currency}）</Label>
                  <Input type="number" value={form.baseSalaryMin} onChange={(e) => updateForm("baseSalaryMin", e.target.value)} placeholder="30000" />
                </div>
                <div className="space-y-2">
                  <Label>最高基本薪資（{form.currency}）</Label>
                  <Input type="number" value={form.baseSalaryMax} onChange={(e) => updateForm("baseSalaryMax", e.target.value)} placeholder="80000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>試用期薪資比例（%）</Label>
                  <Input type="number" value={form.probationRatio} onChange={(e) => updateForm("probationRatio", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>加班費計算基準</Label>
                  <Select value={form.overtimeBase} onValueChange={(v) => updateForm("overtimeBase", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">時薪制</SelectItem>
                      <SelectItem value="daily">日薪制</SelectItem>
                      <SelectItem value="monthly">月薪制</SelectItem>
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
                  <Gift className="h-4 w-4 text-success" />加項（津貼/補助）
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addItem("earning")}>
                  <Plus className="h-3.5 w-3.5 mr-1" />新增加項
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">尚未設定加項</p>
              ) : (
                <div className="space-y-3">
                  {earnings.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">項目名稱</Label>
                          <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="項目名稱" className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">類型</Label>
                          <Select value={item.type} onValueChange={(v) => updateItem(item.id, "type", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">固定金額</SelectItem>
                              <SelectItem value="percentage">百分比</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{item.type === "fixed" ? `金額（${form.currency}）` : "百分比（%）"}</Label>
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

          {/* Deductions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />減項（扣除/保險）
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addItem("deduction")}>
                  <Plus className="h-3.5 w-3.5 mr-1" />新增減項
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">尚未設定減項</p>
              ) : (
                <div className="space-y-3">
                  {deductions.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">項目名稱</Label>
                          <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="項目名稱" className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">類型</Label>
                          <Select value={item.type} onValueChange={(v) => updateItem(item.id, "type", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">固定金額</SelectItem>
                              <SelectItem value="percentage">百分比</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{item.type === "fixed" ? `金額（${form.currency}）` : "百分比（%）"}</Label>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">方案預覽</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">基本薪資</span>
                  <span className="font-medium text-foreground">
                    {form.baseSalaryMin && form.baseSalaryMax
                      ? `${Number(form.baseSalaryMin).toLocaleString()} ~ ${Number(form.baseSalaryMax).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <Separator />
                <p className="text-xs font-medium text-success">加項</p>
                {earnings.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.name || "未命名"}</span>
                    <span className="text-foreground">{i.type === "fixed" ? `${form.currency} ${i.value.toLocaleString()}` : `${i.value}%`}</span>
                  </div>
                ))}
                <Separator />
                <p className="text-xs font-medium text-warning">減項</p>
                {deductions.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.name || "未命名"}</span>
                    <span className="text-foreground">{i.type === "fixed" ? `${form.currency} ${i.value.toLocaleString()}` : `${i.value}%`}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">其他設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">含年終獎金</p>
                  <p className="text-xs text-muted-foreground">是否適用年終獎金計算</p>
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
