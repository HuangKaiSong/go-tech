import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export interface BonusPenaltyRecord {
  id: string;
  type: "獎金" | "罰款";
  category: string;
  employeeId: string;
  employeeName: string;
  department: string;
  amount: number;
  applyMonth: string;
  applyMonthLabel: string;
  reason: string;
  status: "未計入" | "已計入" | "已取消";
  createdAt: string;
  createdBy: string;
  note: string;
}

const employeeOptions = [
  { id: "EMP-001", name: "張小明", department: "技術部" },
  { id: "EMP-002", name: "李文華", department: "銷售部" },
  { id: "EMP-003", name: "王美玲", department: "人事部" },
  { id: "EMP-004", name: "陳大偉", department: "技術部" },
  { id: "EMP-005", name: "林小芬", department: "行政部" },
  { id: "EMP-006", name: "黃志豪", department: "技術部" },
  { id: "EMP-007", name: "趙雅婷", department: "銷售部" },
  { id: "EMP-008", name: "周建國", department: "人事部" },
  { id: "EMP-009", name: "吳佩珊", department: "會計部" },
  { id: "EMP-010", name: "鄭國強", department: "會計部" },
  { id: "EMP-011", name: "何志明", department: "技術部" },
  { id: "EMP-012", name: "蔡美惠", department: "行政部" },
];

const bonusCategories = ["績效獎金", "專案獎金", "年終獎金", "推薦獎金", "全勤獎金", "其他獎金"];
const penaltyCategories = ["遲到罰款", "曠工罰款", "違規罰款", "損壞賠償", "其他罰款"];

const monthOptions = [
  { value: "2026-03", label: "2026年03月" },
  { value: "2026-04", label: "2026年04月" },
  { value: "2026-05", label: "2026年05月" },
  { value: "2026-06", label: "2026年06月" },
];

export const mockBonusPenaltyRecords: BonusPenaltyRecord[] = [
  {
    id: "BP-001", type: "獎金", category: "績效獎金", employeeId: "EMP-001", employeeName: "張小明", department: "技術部",
    amount: 8000, applyMonth: "2026-03", applyMonthLabel: "2026年03月", reason: "Q1 績效優異，系統交付超前完成",
    status: "已計入", createdAt: "2026-03-05", createdBy: "周建國", note: ""
  },
  {
    id: "BP-002", type: "獎金", category: "專案獎金", employeeId: "EMP-006", employeeName: "黃志豪", department: "技術部",
    amount: 12000, applyMonth: "2026-03", applyMonthLabel: "2026年03月", reason: "客戶管理系統專案順利上線",
    status: "已計入", createdAt: "2026-03-08", createdBy: "周建國", note: ""
  },
  {
    id: "BP-003", type: "罰款", category: "遲到罰款", employeeId: "EMP-005", employeeName: "林小芬", department: "行政部",
    amount: 500, applyMonth: "2026-03", applyMonthLabel: "2026年03月", reason: "3月累計遲到3次",
    status: "已計入", createdAt: "2026-03-10", createdBy: "周建國", note: ""
  },
  {
    id: "BP-004", type: "獎金", category: "推薦獎金", employeeId: "EMP-003", employeeName: "王美玲", department: "人事部",
    amount: 5000, applyMonth: "2026-03", applyMonthLabel: "2026年03月", reason: "成功推薦2名新進員工入職",
    status: "未計入", createdAt: "2026-03-12", createdBy: "周建國", note: ""
  },
  {
    id: "BP-005", type: "罰款", category: "違規罰款", employeeId: "EMP-007", employeeName: "趙雅婷", department: "銷售部",
    amount: 1000, applyMonth: "2026-04", applyMonthLabel: "2026年04月", reason: "未依規定提交客戶報告",
    status: "未計入", createdAt: "2026-03-13", createdBy: "周建國", note: ""
  },
  {
    id: "BP-006", type: "獎金", category: "全勤獎金", employeeId: "EMP-004", employeeName: "陳大偉", department: "技術部",
    amount: 2000, applyMonth: "2026-03", applyMonthLabel: "2026年03月", reason: "3月全勤",
    status: "已計入", createdAt: "2026-03-01", createdBy: "系統自動", note: ""
  },
];

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
  type: "獎金" | "罰款";
  category: string;
  employeeId: string;
  amount: string;
  applyMonth: string;
  reason: string;
  note: string;
}

const emptyForm: FormData = {
  type: "獎金",
  category: "",
  employeeId: "",
  amount: "",
  applyMonth: "",
  reason: "",
  note: "",
};

export default function BonusPenaltyManagement() {
  const navigate = useNavigate();
  const [records, setRecords] = useState(mockBonusPenaltyRecords);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filtered = records.filter(r => {
    const matchSearch = r.employeeName.includes(search) || r.employeeId.toLowerCase().includes(search.toLowerCase()) || r.department.includes(search) || r.category.includes(search);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchMonth = monthFilter === "all" || r.applyMonth === monthFilter;
    return matchSearch && matchType && matchStatus && matchMonth;
  });

  const totalBonus = records.filter(r => r.type === "獎金" && r.status !== "已取消").reduce((s, r) => s + r.amount, 0);
  const totalPenalty = records.filter(r => r.type === "罰款" && r.status !== "已取消").reduce((s, r) => s + r.amount, 0);
  const bonusCount = records.filter(r => r.type === "獎金" && r.status !== "已取消").length;
  const penaltyCount = records.filter(r => r.type === "罰款" && r.status !== "已取消").length;

  const stats = [
    { label: "獎金總額", value: `HK$ ${totalBonus.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
    { label: "罰款總額", value: `HK$ ${totalPenalty.toLocaleString()}`, icon: TrendingDown, color: "text-destructive" },
    { label: "獎金筆數", value: `${bonusCount} 筆`, icon: DollarSign, color: "text-primary" },
    { label: "罰款筆數", value: `${penaltyCount} 筆`, icon: Users, color: "text-warning" },
  ];

  const handleSubmit = () => {
    if (!form.employeeId || !form.amount || !form.applyMonth || !form.category || !form.reason) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    const emp = employeeOptions.find(e => e.id === form.employeeId);
    if (!emp) return;
    const monthLabel = monthOptions.find(m => m.value === form.applyMonth)?.label || form.applyMonth;

    const newRecord: BonusPenaltyRecord = {
      id: `BP-${String(records.length + 1).padStart(3, "0")}`,
      type: form.type,
      category: form.category,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      amount: parseFloat(form.amount),
      applyMonth: form.applyMonth,
      applyMonthLabel: monthLabel,
      reason: form.reason,
      status: "未計入",
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "當前用戶",
      note: form.note,
    };

    setRecords(prev => [newRecord, ...prev]);
    toast.success(`已新增${form.type}記錄：${emp.name} ${form.type === "獎金" ? "+" : "-"}HK$ ${parseFloat(form.amount).toLocaleString()}`);
    setForm(emptyForm);
    setDialogOpen(false);
  };

  const categories = form.type === "獎金" ? bonusCategories : penaltyCategories;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">獎金 / 罰款管理</h1>
          <p className="text-muted-foreground mt-1">手動管理員工獎金與罰款，並指定計入的薪資月份</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          新增獎金/罰款
        </Button>
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
                <p className="text-sm text-muted-foreground">{s.label}</p>
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
              <Input placeholder="搜尋員工、部門、類別..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                <SelectItem value="獎金">獎金</SelectItem>
                <SelectItem value="罰款">罰款</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="未計入">未計入</SelectItem>
                <SelectItem value="已計入">已計入</SelectItem>
                <SelectItem value="已取消">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="計入月份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部月份</SelectItem>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || typeFilter !== "all" || statusFilter !== "all" || monthFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setMonthFilter("all"); }}>
                清除篩選
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
                <TableHead>編號</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>類別</TableHead>
                <TableHead>員工</TableHead>
                <TableHead>部門</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>計入月份</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/bonus-penalty/${r.id}`)}>
                  <TableCell className="font-medium text-primary">{r.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[r.type]}>{r.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.category}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{r.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.department}</TableCell>
                  <TableCell className={`text-right font-semibold ${r.type === "獎金" ? "text-success" : "text-destructive"}`}>
                    {r.type === "獎金" ? "+" : "-"}{r.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{r.applyMonthLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigate(`/payroll/bonus-penalty/${r.id}`)}>
                      <Eye className="h-3.5 w-3.5" /> 查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">沒有符合條件的記錄</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增獎金 / 罰款</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>類型 <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v as "獎金" | "罰款", category: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="獎金">獎金</SelectItem>
                    <SelectItem value="罰款">罰款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>類別 <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇類別" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>員工 <span className="text-destructive">*</span></Label>
              <Select value={form.employeeId} onValueChange={v => setForm(prev => ({ ...prev, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="選擇員工" /></SelectTrigger>
                <SelectContent>
                  {employeeOptions.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}（{e.id} · {e.department}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>金額 (HK$) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="輸入金額" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>計入月份 <span className="text-destructive">*</span></Label>
                <Select value={form.applyMonth} onValueChange={v => setForm(prev => ({ ...prev, applyMonth: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇月份" /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>原因 <span className="text-destructive">*</span></Label>
              <Textarea placeholder="請輸入獎金/罰款原因" value={form.reason} onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Input placeholder="選填備註" value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>確認新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
