import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  DollarSign, Plus, Search, Filter, ChevronRight,
  MoreHorizontal, Eye, Pencil, Power, Trash2,
  Users, TrendingUp, FileText
} from "lucide-react";
import { toast } from "sonner";

export interface PayrollPlan {
  id: string;
  name: string;
  code: string;
  baseSalaryMin: number;
  baseSalaryMax: number;
  allowance: number;
  insurance: number;
  applicable: string;
  applicableCount: number;
  status: "啟用" | "停用";
  createdAt: string;
  updatedAt: string;
  description: string;
}

export const mockPlans: PayrollPlan[] = [
  { id: "PS-001", name: "技術職等 A", code: "TECH-A", baseSalaryMin: 50000, baseSalaryMax: 80000, allowance: 5000, insurance: 3200, applicable: "高級工程師", applicableCount: 12, status: "啟用", createdAt: "2025-01-15", updatedAt: "2026-02-10", description: "適用於資深技術人員，包含技術津貼與績效獎金基數。" },
  { id: "PS-002", name: "技術職等 B", code: "TECH-B", baseSalaryMin: 35000, baseSalaryMax: 50000, allowance: 3000, insurance: 2400, applicable: "工程師", applicableCount: 28, status: "啟用", createdAt: "2025-01-15", updatedAt: "2026-01-20", description: "適用於一般技術人員，含標準津貼方案。" },
  { id: "PS-003", name: "管理職等", code: "MGR", baseSalaryMin: 70000, baseSalaryMax: 120000, allowance: 8000, insurance: 4800, applicable: "部門主管", applicableCount: 6, status: "啟用", createdAt: "2025-02-01", updatedAt: "2026-03-01", description: "適用於管理階層，含主管加給與交通補助。" },
  { id: "PS-004", name: "行政職等", code: "ADM", baseSalaryMin: 30000, baseSalaryMax: 45000, allowance: 2000, insurance: 2000, applicable: "行政人員", applicableCount: 15, status: "啟用", createdAt: "2025-01-20", updatedAt: "2025-12-15", description: "適用於行政與後勤人員。" },
  { id: "PS-005", name: "實習生方案", code: "INT", baseSalaryMin: 27470, baseSalaryMax: 30000, allowance: 0, insurance: 1200, applicable: "實習生", applicableCount: 4, status: "啟用", createdAt: "2025-06-01", updatedAt: "2025-06-01", description: "適用於實習生，依基本工資計算。" },
  { id: "PS-006", name: "銷售職等（舊）", code: "SALE-OLD", baseSalaryMin: 32000, baseSalaryMax: 55000, allowance: 2500, insurance: 2200, applicable: "銷售人員", applicableCount: 0, status: "停用", createdAt: "2024-06-01", updatedAt: "2025-12-31", description: "已停用，由新版銷售職等取代。" },
];

const statusColors: Record<string, string> = {
  "啟用": "bg-success/10 text-success border-success/20",
  "停用": "bg-muted text-muted-foreground border-border",
};

const stats = [
  { label: "方案總數", value: mockPlans.length, icon: FileText, color: "text-primary" },
  { label: "啟用中", value: mockPlans.filter(p => p.status === "啟用").length, icon: TrendingUp, color: "text-success" },
  { label: "適用員工", value: mockPlans.reduce((s, p) => s + p.applicableCount, 0), icon: Users, color: "text-accent" },
  { label: "已停用", value: mockPlans.filter(p => p.status === "停用").length, icon: Power, color: "text-muted-foreground" },
];

export default function PayrollStructure() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [plans, setPlans] = useState(mockPlans);
  const [deleteTarget, setDeleteTarget] = useState<PayrollPlan | null>(null);
  const [disableTarget, setDisableTarget] = useState<PayrollPlan | null>(null);

  const filtered = plans.filter((p) => {
    const matchSearch = p.name.includes(search) || p.code.toLowerCase().includes(search.toLowerCase()) || p.applicable.includes(search);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleToggleStatus = (plan: PayrollPlan) => {
    if (plan.status === "啟用") {
      setDisableTarget(plan);
    } else {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: "啟用", updatedAt: new Date().toISOString().slice(0, 10) } : p));
      toast.success(`已啟用方案「${plan.name}」`);
    }
  };

  const confirmDisable = () => {
    if (!disableTarget) return;
    setPlans(prev => prev.map(p => p.id === disableTarget.id ? { ...p, status: "停用", updatedAt: new Date().toISOString().slice(0, 10) } : p));
    toast.success(`已停用方案「${disableTarget.name}」`);
    setDisableTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setPlans(prev => prev.filter(p => p.id !== deleteTarget.id));
    toast.success(`已刪除方案「${deleteTarget.name}」`);
    setDeleteTarget(null);
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            薪資結構
          </h1>
          <p className="text-muted-foreground mt-1">管理薪資方案與結構設定</p>
        </div>
        <Button onClick={() => navigate("/payroll/structure/new")}>
          <Plus className="h-4 w-4 mr-2" />新增方案
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜尋方案名稱/代碼/適用對象..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="啟用">啟用</SelectItem>
            <SelectItem value="停用">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>方案名稱</TableHead>
                <TableHead>代碼</TableHead>
                <TableHead>基本薪資範圍</TableHead>
                <TableHead>津貼</TableHead>
                <TableHead>保險扣除</TableHead>
                <TableHead>適用對象</TableHead>
                <TableHead>適用人數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>更新日期</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">暫無方案</TableCell></TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/structure/${p.id}`)}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{p.code}</TableCell>
                    <TableCell className="text-sm">{fmt(p.baseSalaryMin)} ~ {fmt(p.baseSalaryMax)}</TableCell>
                    <TableCell className="text-sm">{fmt(p.allowance)}</TableCell>
                    <TableCell className="text-sm">{fmt(p.insurance)}</TableCell>
                    <TableCell>{p.applicable}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{p.applicableCount} 人</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[p.status]} border text-xs`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.updatedAt}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/payroll/structure/${p.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />查看詳情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/payroll/structure/${p.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />編輯方案
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(p)}>
                            <Power className="h-4 w-4 mr-2" />
                            {p.status === "啟用" ? "停用方案" : "啟用方案"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(p)}>
                            <Trash2 className="h-4 w-4 mr-2" />刪除方案
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Disable Confirm */}
      <AlertDialog open={!!disableTarget} onOpenChange={(o) => !o && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認停用方案</AlertDialogTitle>
            <AlertDialogDescription>
              停用「{disableTarget?.name}」後，該方案將不再適用於新的薪資計算。目前適用 {disableTarget?.applicableCount} 名員工，停用後需為其重新指派方案。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>確認停用</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除方案</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteTarget?.name}」嗎？此操作無法復原。{deleteTarget && deleteTarget.applicableCount > 0 && `目前仍有 ${deleteTarget.applicableCount} 名員工適用此方案，刪除前請先調整。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">確認刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
