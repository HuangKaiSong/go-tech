import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GraduationCap, Plus, Search, BookOpen, Users, Clock, Eye,
  Layers, Target, UserPlus
} from "lucide-react";
import { toast } from "sonner";

export interface TrainingPlanRecord {
  id: string;
  name: string;
  type: "入職培訓" | "職位培訓" | "技能培訓" | "管理培訓" | "合規培訓";
  targetScope: string; // e.g. "所有新員工", "技術部-工程師", "全公司"
  targetType: "all_new" | "position" | "department" | "manual";
  targetPositions: string[];
  targetDepartments: string[];
  totalModules: number;
  estimatedHours: number;
  participantCount: number;
  completedCount: number;
  status: "草稿" | "已發佈" | "進行中" | "已結束";
  mandatory: boolean;
  createdAt: string;
  updatedAt: string;
  creator: string;
  description: string;
}

export const mockTrainingPlans: TrainingPlanRecord[] = [
  {
    id: "TP-001", name: "新員工入職培訓", type: "入職培訓",
    targetScope: "所有新員工", targetType: "all_new", targetPositions: [], targetDepartments: [],
    totalModules: 5, estimatedHours: 8, participantCount: 12, completedCount: 7,
    status: "進行中", mandatory: true, createdAt: "2026-01-15", updatedAt: "2026-03-10",
    creator: "王美玲", description: "針對所有新進員工的入職培訓，涵蓋公司文化、規章制度、基本系統操作等內容。"
  },
  {
    id: "TP-002", name: "前端工程師技術培訓", type: "職位培訓",
    targetScope: "技術部 - 前端工程師", targetType: "position", targetPositions: ["前端工程師", "高級前端工程師"], targetDepartments: ["技術部"],
    totalModules: 8, estimatedHours: 16, participantCount: 6, completedCount: 2,
    status: "進行中", mandatory: true, createdAt: "2026-02-01", updatedAt: "2026-03-08",
    creator: "張小明", description: "針對前端工程師崗位的技術培訓，包含公司技術棧、代碼規範、開發流程等。"
  },
  {
    id: "TP-003", name: "銷售技巧進階課程", type: "技能培訓",
    targetScope: "銷售部全員", targetType: "department", targetPositions: [], targetDepartments: ["銷售部"],
    totalModules: 6, estimatedHours: 12, participantCount: 15, completedCount: 15,
    status: "已結束", mandatory: false, createdAt: "2026-01-10", updatedAt: "2026-02-28",
    creator: "李文華", description: "提升銷售團隊的溝通技巧和客戶管理能力。"
  },
  {
    id: "TP-004", name: "領導力發展計劃", type: "管理培訓",
    targetScope: "主管及以上", targetType: "manual", targetPositions: [], targetDepartments: [],
    totalModules: 4, estimatedHours: 10, participantCount: 8, completedCount: 0,
    status: "已發佈", mandatory: false, createdAt: "2026-03-01", updatedAt: "2026-03-05",
    creator: "周建國", description: "培養中層管理者的領導能力、團隊管理與決策技巧。"
  },
  {
    id: "TP-005", name: "資訊安全合規培訓", type: "合規培訓",
    targetScope: "全公司", targetType: "all_new", targetPositions: [], targetDepartments: [],
    totalModules: 3, estimatedHours: 4, participantCount: 65, completedCount: 58,
    status: "進行中", mandatory: true, createdAt: "2026-02-15", updatedAt: "2026-03-12",
    creator: "系統管理員", description: "公司資訊安全政策與合規要求的年度培訓。"
  },
  {
    id: "TP-006", name: "後端開發新人培訓", type: "職位培訓",
    targetScope: "技術部 - 後端工程師", targetType: "position", targetPositions: ["後端工程師", "工程師"], targetDepartments: ["技術部"],
    totalModules: 7, estimatedHours: 14, participantCount: 4, completedCount: 1,
    status: "進行中", mandatory: true, createdAt: "2026-02-20", updatedAt: "2026-03-11",
    creator: "陳大偉", description: "針對後端開發崗位的技術培訓，包含後端架構、數據庫設計、API 開發等。"
  },
];

const statusColors: Record<string, string> = {
  "草稿": "bg-muted text-muted-foreground border-border",
  "已發佈": "bg-primary/10 text-primary border-primary/20",
  "進行中": "bg-warning/10 text-warning border-warning/20",
  "已結束": "bg-success/10 text-success border-success/20",
};

const typeColors: Record<string, string> = {
  "入職培訓": "bg-primary/10 text-primary border-primary/20",
  "職位培訓": "bg-accent/10 text-accent-foreground border-accent/20",
  "技能培訓": "bg-warning/10 text-warning border-warning/20",
  "管理培訓": "bg-success/10 text-success border-success/20",
  "合規培訓": "bg-destructive/10 text-destructive border-destructive/20",
};

const typeOptions: TrainingPlanRecord["type"][] = ["入職培訓", "職位培訓", "技能培訓", "管理培訓", "合規培訓"];
const targetTypeOptions = [
  { value: "all_new", label: "所有新員工" },
  { value: "position", label: "指定職位" },
  { value: "department", label: "指定部門" },
  { value: "manual", label: "手動指定" },
];

const positionOptions = ["前端工程師", "高級前端工程師", "後端工程師", "工程師", "測試工程師", "銷售經理", "業務代表", "人事專員", "會計專員", "行政助理"];
const departmentOptions = ["技術部", "銷售部", "人事部", "行政部", "會計部"];

interface FormData {
  name: string;
  type: TrainingPlanRecord["type"];
  targetType: string;
  targetPositions: string[];
  targetDepartments: string[];
  mandatory: boolean;
  estimatedHours: string;
  description: string;
}

const emptyForm: FormData = {
  name: "", type: "入職培訓", targetType: "all_new",
  targetPositions: [], targetDepartments: [],
  mandatory: true, estimatedHours: "", description: "",
};

export default function TrainingPlans() {
  const navigate = useNavigate();
  const [records, setRecords] = useState(mockTrainingPlans);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filtered = records.filter(r => {
    const matchSearch = r.name.includes(search) || r.targetScope.includes(search) || r.creator.includes(search);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalPlans = records.length;
  const activePlans = records.filter(r => r.status === "進行中" || r.status === "已發佈").length;
  const totalParticipants = records.reduce((s, r) => s + r.participantCount, 0);
  const avgCompletion = records.filter(r => r.participantCount > 0).length > 0
    ? Math.round(records.reduce((s, r) => s + (r.participantCount > 0 ? (r.completedCount / r.participantCount) * 100 : 0), 0) / records.filter(r => r.participantCount > 0).length)
    : 0;

  const stats = [
    { label: "培訓計劃總數", value: `${totalPlans} 個`, icon: BookOpen, color: "text-primary" },
    { label: "進行中/已發佈", value: `${activePlans} 個`, icon: Target, color: "text-warning" },
    { label: "總參訓人次", value: `${totalParticipants} 人`, icon: Users, color: "text-success" },
    { label: "平均完成率", value: `${avgCompletion}%`, icon: GraduationCap, color: "text-accent-foreground" },
  ];

  const getTargetScopeLabel = (f: FormData) => {
    if (f.targetType === "all_new") return "所有新員工";
    if (f.targetType === "position") return f.targetPositions.join("、") || "未選擇";
    if (f.targetType === "department") return f.targetDepartments.join("、") || "未選擇";
    return "手動指定";
  };

  const handleSubmit = () => {
    if (!form.name || !form.estimatedHours || !form.description) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    if (form.targetType === "position" && form.targetPositions.length === 0) {
      toast.error("請選擇至少一個目標職位");
      return;
    }
    if (form.targetType === "department" && form.targetDepartments.length === 0) {
      toast.error("請選擇至少一個目標部門");
      return;
    }

    const newRecord: TrainingPlanRecord = {
      id: `TP-${String(records.length + 1).padStart(3, "0")}`,
      name: form.name,
      type: form.type,
      targetScope: getTargetScopeLabel(form),
      targetType: form.targetType as TrainingPlanRecord["targetType"],
      targetPositions: form.targetPositions,
      targetDepartments: form.targetDepartments,
      totalModules: 0,
      estimatedHours: parseFloat(form.estimatedHours),
      participantCount: 0,
      completedCount: 0,
      status: "草稿",
      mandatory: form.mandatory,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      creator: "當前用戶",
      description: form.description,
    };

    setRecords(prev => [newRecord, ...prev]);
    toast.success(`培訓計劃「${form.name}」已建立`);
    setForm(emptyForm);
    setDialogOpen(false);
    navigate(`/training/plans/${newRecord.id}`);
  };

  const togglePosition = (pos: string) => {
    setForm(prev => ({
      ...prev,
      targetPositions: prev.targetPositions.includes(pos)
        ? prev.targetPositions.filter(p => p !== pos)
        : [...prev.targetPositions, pos],
    }));
  };

  const toggleDepartment = (dept: string) => {
    setForm(prev => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(dept)
        ? prev.targetDepartments.filter(d => d !== dept)
        : [...prev.targetDepartments, dept],
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">培訓計劃</h1>
          <p className="text-muted-foreground mt-1">建立與管理培訓計劃，支援關聯新員工或特定職位自動分配培訓</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> 新增培訓計劃
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
              <Input placeholder="搜尋計劃名稱、適用範圍..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="培訓類型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="狀態" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="已發佈">已發佈</SelectItem>
                <SelectItem value="進行中">進行中</SelectItem>
                <SelectItem value="已結束">已結束</SelectItem>
              </SelectContent>
            </Select>
            {(search || typeFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}>
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
                <TableHead>計劃名稱</TableHead>
                <TableHead>培訓類型</TableHead>
                <TableHead>適用對象</TableHead>
                <TableHead>課程模組</TableHead>
                <TableHead>預計時數</TableHead>
                <TableHead>完成進度</TableHead>
                <TableHead>必修</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/training/plans/${r.id}`)}>
                  <TableCell className="font-medium text-primary">{r.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[r.type]}>{r.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {r.targetType === "all_new" && <UserPlus className="h-3.5 w-3.5 text-primary" />}
                      {r.targetType === "position" && <Target className="h-3.5 w-3.5 text-accent-foreground" />}
                      {r.targetType === "department" && <Layers className="h-3.5 w-3.5 text-warning" />}
                      {r.targetType === "manual" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-sm">{r.targetScope}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.totalModules} 個</TableCell>
                  <TableCell className="text-sm">{r.estimatedHours} 小時</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${r.participantCount > 0 ? (r.completedCount / r.participantCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{r.completedCount}/{r.participantCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.mandatory ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">必修</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">選修</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigate(`/training/plans/${r.id}`)}>
                      <Eye className="h-3.5 w-3.5" /> 查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">沒有符合條件的培訓計劃</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增培訓計劃</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>計劃名稱 <span className="text-destructive">*</span></Label>
              <Input placeholder="例：新員工入職培訓" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>培訓類型 <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v as TrainingPlanRecord["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>預計時數 (小時) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="例：8" value={form.estimatedHours} onChange={e => setForm(prev => ({ ...prev, estimatedHours: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>適用對象 <span className="text-destructive">*</span></Label>
              <Select value={form.targetType} onValueChange={v => setForm(prev => ({ ...prev, targetType: v, targetPositions: [], targetDepartments: [] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {targetTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.targetType === "all_new" && "所有新入職員工將自動分配此培訓"}
                {form.targetType === "position" && "新員工若為指定職位，將自動分配此培訓"}
                {form.targetType === "department" && "指定部門的員工將被分配此培訓"}
                {form.targetType === "manual" && "需手動在詳情頁中添加參訓人員"}
              </p>
            </div>

            {form.targetType === "position" && (
              <div className="space-y-2">
                <Label>選擇職位 <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {positionOptions.map(pos => (
                    <label key={pos} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.targetPositions.includes(pos)} onCheckedChange={() => togglePosition(pos)} />
                      {pos}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.targetType === "department" && (
              <div className="space-y-2">
                <Label>選擇部門 <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                  {departmentOptions.map(dept => (
                    <label key={dept} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.targetDepartments.includes(dept)} onCheckedChange={() => toggleDepartment(dept)} />
                      {dept}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox checked={form.mandatory} onCheckedChange={v => setForm(prev => ({ ...prev, mandatory: !!v }))} />
              <Label className="cursor-pointer">設為必修課程</Label>
              <span className="text-xs text-muted-foreground">（必修課程員工需在期限內完成）</span>
            </div>

            <div className="space-y-2">
              <Label>培訓簡介 <span className="text-destructive">*</span></Label>
              <Textarea placeholder="請輸入培訓計劃的簡要描述..." value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>建立計劃</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
