import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, Search, Download, Users, CheckCircle, Clock,
  BookOpen, Eye, Award, TrendingUp
} from "lucide-react";

interface TrainingRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  planId: string;
  planName: string;
  planType: string;
  totalModules: number;
  completedModules: number;
  progress: number;
  score: number | null;
  status: "未開始" | "進行中" | "已完成" | "未通過";
  startDate: string;
  completedAt: string | null;
  certificate: "已發放" | "未發放" | "不適用";
}

const mockRecords: TrainingRecord[] = [
  { id: "TR-001", employeeId: "EMP-020", name: "劉曉東", department: "技術部", position: "工程師", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 5, progress: 100, score: 92, status: "已完成", startDate: "2026-03-01", completedAt: "2026-03-05", certificate: "已發放" },
  { id: "TR-002", employeeId: "EMP-021", name: "陳怡君", department: "銷售部", position: "業務代表", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 5, progress: 100, score: 88, status: "已完成", startDate: "2026-03-01", completedAt: "2026-03-06", certificate: "已發放" },
  { id: "TR-003", employeeId: "EMP-022", name: "林志偉", department: "技術部", position: "測試工程師", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 4, progress: 80, score: null, status: "進行中", startDate: "2026-03-03", completedAt: null, certificate: "不適用" },
  { id: "TR-004", employeeId: "EMP-023", name: "許雅文", department: "人事部", position: "人事專員", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 3, progress: 60, score: null, status: "進行中", startDate: "2026-03-05", completedAt: null, certificate: "不適用" },
  { id: "TR-005", employeeId: "EMP-024", name: "蔡明哲", department: "行政部", position: "行政助理", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 2, progress: 40, score: null, status: "進行中", startDate: "2026-03-07", completedAt: null, certificate: "不適用" },
  { id: "TR-006", employeeId: "EMP-026", name: "鄭家豪", department: "技術部", position: "前端工程師", planId: "TP-001", planName: "新員工入職培訓", planType: "入職培訓", totalModules: 5, completedModules: 0, progress: 0, score: null, status: "未開始", startDate: "2026-03-10", completedAt: null, certificate: "不適用" },
  { id: "TR-007", employeeId: "EMP-026", name: "鄭家豪", department: "技術部", position: "前端工程師", planId: "TP-002", planName: "前端工程師技術培訓", planType: "職位培訓", totalModules: 8, completedModules: 2, progress: 25, score: null, status: "進行中", startDate: "2026-03-10", completedAt: null, certificate: "不適用" },
  { id: "TR-008", employeeId: "EMP-027", name: "吳佳琳", department: "技術部", position: "前端工程師", planId: "TP-002", planName: "前端工程師技術培訓", planType: "職位培訓", totalModules: 8, completedModules: 8, progress: 100, score: 95, status: "已完成", startDate: "2026-02-15", completedAt: "2026-03-05", certificate: "已發放" },
  { id: "TR-009", employeeId: "EMP-028", name: "謝志豪", department: "技術部", position: "高級前端工程師", planId: "TP-002", planName: "前端工程師技術培訓", planType: "職位培訓", totalModules: 8, completedModules: 7, progress: 88, score: null, status: "進行中", startDate: "2026-02-20", completedAt: null, certificate: "不適用" },
  { id: "TR-010", employeeId: "EMP-001", name: "張小明", department: "銷售部", position: "銷售經理", planId: "TP-003", planName: "銷售技巧進階課程", planType: "技能培訓", totalModules: 6, completedModules: 6, progress: 100, score: 88, status: "已完成", startDate: "2026-01-15", completedAt: "2026-02-20", certificate: "已發放" },
  { id: "TR-011", employeeId: "EMP-003", name: "李文華", department: "銷售部", position: "業務代表", planId: "TP-003", planName: "銷售技巧進階課程", planType: "技能培訓", totalModules: 6, completedModules: 6, progress: 100, score: 92, status: "已完成", startDate: "2026-01-15", completedAt: "2026-02-10", certificate: "已發放" },
  { id: "TR-012", employeeId: "EMP-002", name: "黃志偉", department: "銷售部", position: "業務代表", planId: "TP-003", planName: "銷售技巧進階課程", planType: "技能培訓", totalModules: 6, completedModules: 6, progress: 100, score: 75, status: "已完成", startDate: "2026-01-15", completedAt: "2026-02-20", certificate: "已發放" },
  { id: "TR-013", employeeId: "EMP-025", name: "楊淑惠", department: "會計部", position: "會計專員", planId: "TP-005", planName: "資訊安全合規培訓", planType: "合規培訓", totalModules: 3, completedModules: 1, progress: 33, score: null, status: "進行中", startDate: "2026-03-01", completedAt: null, certificate: "不適用" },
  { id: "TR-014", employeeId: "EMP-020", name: "劉曉東", department: "技術部", position: "工程師", planId: "TP-005", planName: "資訊安全合規培訓", planType: "合規培訓", totalModules: 3, completedModules: 3, progress: 100, score: 85, status: "已完成", startDate: "2026-02-20", completedAt: "2026-03-01", certificate: "已發放" },
  { id: "TR-015", employeeId: "EMP-022", name: "林志偉", department: "技術部", position: "測試工程師", planId: "TP-005", planName: "資訊安全合規培訓", planType: "合規培訓", totalModules: 3, completedModules: 2, progress: 67, score: null, status: "進行中", startDate: "2026-03-03", completedAt: null, certificate: "不適用" },
];

const statusColors: Record<string, string> = {
  "未開始": "bg-muted text-muted-foreground border-border",
  "進行中": "bg-primary/10 text-primary border-primary/20",
  "已完成": "bg-success/10 text-success border-success/20",
  "未通過": "bg-destructive/10 text-destructive border-destructive/20",
};

const certColors: Record<string, string> = {
  "已發放": "bg-success/10 text-success border-success/20",
  "未發放": "bg-warning/10 text-warning border-warning/20",
  "不適用": "bg-muted text-muted-foreground border-border",
};

const planTypeColors: Record<string, string> = {
  "入職培訓": "bg-primary/10 text-primary border-primary/20",
  "職位培訓": "bg-accent/10 text-accent-foreground border-accent/20",
  "技能培訓": "bg-warning/10 text-warning border-warning/20",
  "管理培訓": "bg-success/10 text-success border-success/20",
  "合規培訓": "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TrainingRecords() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const plans = [...new Set(mockRecords.map(r => r.planName))];
  const depts = [...new Set(mockRecords.map(r => r.department))];

  const filtered = mockRecords.filter(r => {
    const matchSearch = r.name.includes(search) || r.employeeId.includes(search) || r.planName.includes(search);
    const matchPlan = planFilter === "all" || r.planName === planFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchDept = deptFilter === "all" || r.department === deptFilter;
    return matchSearch && matchPlan && matchStatus && matchDept;
  });

  const totalRecords = mockRecords.length;
  const completedRecords = mockRecords.filter(r => r.status === "已完成").length;
  const avgScore = Math.round(
    mockRecords.filter(r => r.score !== null).reduce((s, r) => s + (r.score || 0), 0) /
    (mockRecords.filter(r => r.score !== null).length || 1)
  );
  const avgProgress = Math.round(mockRecords.reduce((s, r) => s + r.progress, 0) / totalRecords);

  const stats = [
    { label: "培訓記錄總數", value: `${totalRecords} 筆`, icon: BookOpen, color: "text-primary" },
    { label: "已完成培訓", value: `${completedRecords} 筆`, icon: CheckCircle, color: "text-success" },
    { label: "平均成績", value: `${avgScore} 分`, icon: Award, color: "text-warning" },
    { label: "整體進度", value: `${avgProgress}%`, icon: TrendingUp, color: "text-accent-foreground" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success font-bold";
    if (score >= 80) return "text-primary font-semibold";
    if (score >= 60) return "text-warning font-semibold";
    return "text-destructive font-bold";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            培訓記錄
          </h1>
          <p className="text-muted-foreground mt-1">查看員工培訓完成情況、成績與證書發放狀態</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> 匯出報表
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
              <Input placeholder="搜尋員工、編號、計劃名稱..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="培訓計劃" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部計劃</SelectItem>
                {plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="狀態" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="未開始">未開始</SelectItem>
                <SelectItem value="進行中">進行中</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
                <SelectItem value="未通過">未通過</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="部門" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部門</SelectItem>
                {depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || planFilter !== "all" || statusFilter !== "all" || deptFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); setDeptFilter("all"); }}>
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
                <TableHead>員工</TableHead>
                <TableHead>部門/職位</TableHead>
                <TableHead>關聯培訓計劃</TableHead>
                <TableHead>培訓進度</TableHead>
                <TableHead>成績</TableHead>
                <TableHead>證書</TableHead>
                <TableHead>開始日期</TableHead>
                <TableHead>完成日期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{r.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{r.department}</p>
                    <p className="text-xs text-muted-foreground">{r.position}</p>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-left hover:underline"
                      onClick={() => navigate(`/training/plans/${r.planId}`)}
                    >
                      <p className="text-sm font-medium text-primary">{r.planName}</p>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${planTypeColors[r.planType]}`}>{r.planType}</Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[120px]">
                      <div className="flex items-center justify-between text-xs">
                        <span>{r.completedModules}/{r.totalModules} 模組</span>
                        <span className="font-medium">{r.progress}%</span>
                      </div>
                      <Progress value={r.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.score !== null ? (
                      <span className={`text-sm ${getScoreColor(r.score)}`}>{r.score} 分</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${certColors[r.certificate]}`}>{r.certificate}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.startDate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.completedAt || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigate(`/training/plans/${r.planId}`)}>
                      <Eye className="h-3.5 w-3.5" /> 查看計劃
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                    沒有符合條件的培訓記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
