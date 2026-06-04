import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  ArrowLeft, Save, Calculator, Search, DollarSign, Users
} from "lucide-react";
import { toast } from "sonner";
import { mockCalcRecords, mockEmployees, type PayrollEmployee } from "./PayrollCalculate";

const months = [
  "2026年03月", "2026年02月", "2026年01月",
  "2025年12月", "2025年11月", "2025年10月",
];

export default function PayrollCalcForm() {
  const { calcId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!calcId;
  const existing = isEdit ? mockCalcRecords.find(r => r.id === calcId) : null;

  const [form, setForm] = useState({
    period: existing?.period || months[0],
    note: "",
  });

  const [employees, setEmployees] = useState<(PayrollEmployee & { selected: boolean; editBaseSalary: string; editOvertimeHours: string })[]>(
    mockEmployees.map(e => ({
      ...e,
      selected: true,
      editBaseSalary: e.baseSalary.toString(),
      editOvertimeHours: e.overtime.hours.toString(),
    }))
  );

  const [search, setSearch] = useState("");

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.employeeId.toLowerCase().includes(search.toLowerCase()) || e.department.includes(search)
  );

  const selectedCount = employees.filter(e => e.selected).length;

  const toggleAll = (checked: boolean) => {
    setEmployees(prev => prev.map(e => ({ ...e, selected: checked })));
  };

  const toggleOne = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  };

  const updateEmployee = (id: string, field: "editBaseSalary" | "editOvertimeHours", value: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    toast.success(isEdit ? "薪資計算已更新" : "薪資計算批次已建立");
    navigate("/payroll/calculate");
  };

  const handleCalculateAndSave = () => {
    toast.success("薪資計算完成並已儲存");
    navigate("/payroll/calculate");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? "編輯薪資計算" : "新增薪資計算"}</h1>
            <p className="text-muted-foreground mt-1">{isEdit ? `編輯 ${existing?.period} 的薪資計算` : "建立新的月度薪資計算批次"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>取消</Button>
          <Button variant="outline" className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> 儲存草稿
          </Button>
          <Button className="gap-2" onClick={handleCalculateAndSave}>
            <Calculator className="h-4 w-4" /> 計算並儲存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>薪資期間</Label>
                <Select value={form.period} onValueChange={v => setForm(p => ({ ...p, period: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>備註</Label>
                <Textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="輸入備註說明..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">計算摘要</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">選取人數</span>
                  <span className="font-medium">{selectedCount} / {employees.length} 人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">基本薪資合計</span>
                  <span className="font-medium">
                    {employees.filter(e => e.selected).reduce((s, e) => s + Number(e.editBaseSalary || 0), 0).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>薪資期間</span>
                  <span className="text-primary">{form.period}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Employee Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">員工薪資資料</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜尋員工..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={employees.every(e => e.selected)}
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </TableHead>
                    <TableHead>員工</TableHead>
                    <TableHead>部門</TableHead>
                    <TableHead>適用方案</TableHead>
                    <TableHead className="text-right">基本薪資</TableHead>
                    <TableHead className="text-right">加班時數</TableHead>
                    <TableHead>狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(emp => (
                    <TableRow key={emp.id} className={!emp.selected ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox checked={emp.selected} onCheckedChange={() => toggleOne(emp.id)} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{emp.planName}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={emp.editBaseSalary}
                          onChange={e => updateEmployee(emp.id, "editBaseSalary", e.target.value)}
                          className="w-28 h-8 text-right ml-auto"
                          disabled={!emp.selected}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={emp.editOvertimeHours}
                          onChange={e => updateEmployee(emp.id, "editOvertimeHours", e.target.value)}
                          className="w-20 h-8 text-right ml-auto"
                          disabled={!emp.selected}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={emp.selected ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                          {emp.selected ? "已選取" : "未選取"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
