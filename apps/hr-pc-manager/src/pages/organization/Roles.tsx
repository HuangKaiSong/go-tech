import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Plus, Download, Filter, Users, Layers, BarChart3, Shield, Eye, Pencil, Lock, Clock, DollarSign, Target, GraduationCap, ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Permission types & data
type PermLevel = "none" | "view" | "edit" | "full";

interface PermissionModule {
  id: string;
  name: string;
  icon: typeof Shield;
  children: { id: string; name: string }[];
}

const permissionModules: PermissionModule[] = [
  { id: "employee", name: "員工管理", icon: Users, children: [
    { id: "employee.list", name: "員工列表" }, { id: "employee.detail", name: "員工詳情" },
    { id: "employee.onboard", name: "入職管理" }, { id: "employee.offboard", name: "離職管理" },
    { id: "employee.self", name: "員工自助" },
  ]},
  { id: "attendance", name: "行政管理", icon: Clock, children: [
    { id: "attendance.records", name: "考勤記錄" }, { id: "attendance.leave", name: "請假管理" },
    { id: "attendance.overtime", name: "加班管理" }, { id: "attendance.approval", name: "審批管理" },
  ]},
  { id: "payroll", name: "薪資管理", icon: DollarSign, children: [
    { id: "payroll.structure", name: "薪資結構" }, { id: "payroll.calculate", name: "薪資計算" },
    { id: "payroll.distribute", name: "薪資發放" },
  ]},
  { id: "performance", name: "績效管理", icon: Target, children: [
    { id: "performance.evaluation", name: "績效評估" }, { id: "performance.plans", name: "績效計劃" },
  ]},
  { id: "training", name: "培訓管理", icon: GraduationCap, children: [
    { id: "training.plans", name: "培訓計劃" }, { id: "training.records", name: "培訓記錄" },
  ]},
  { id: "organization", name: "組織架構", icon: Building2, children: [
    { id: "organization.dept", name: "部門管理" }, { id: "organization.role", name: "職位管理" },
    { id: "organization.chart", name: "組織圖" },
  ]},
  { id: "system", name: "系統管理", icon: Shield, children: [
    { id: "system.settings", name: "系統設定" }, { id: "system.permissions", name: "權限管理" },
    { id: "system.logs", name: "操作日誌" },
  ]},
];

const permLevels: { value: PermLevel; label: string; color: string; icon: typeof Eye }[] = [
  { value: "none", label: "無權限", color: "text-muted-foreground", icon: Lock },
  { value: "view", label: "僅查看", color: "text-accent", icon: Eye },
  { value: "edit", label: "可編輯", color: "text-warning", icon: Pencil },
  { value: "full", label: "完全控制", color: "text-success", icon: Shield },
];

const getDefaultPermissions = (level: string): Record<string, PermLevel> => {
  const perms: Record<string, PermLevel> = {};
  const isManager = level.startsWith("M");
  const rank = parseInt(level[1]);
  permissionModules.forEach(mod => {
    mod.children.forEach(child => {
      if (isManager && rank >= 2) perms[child.id] = "full";
      else if (isManager) perms[child.id] = "edit";
      else if (rank >= 3) perms[child.id] = "edit";
      else if (rank >= 2) perms[child.id] = "view";
      else perms[child.id] = "none";
    });
  });
  return perms;
};

const rolesData = [
  { id: "R001", title: "技術總監", level: "M3", department: "技術部", headcount: 1, status: "啟用", salaryRange: "80K-120K", createdAt: "2023-01-15" },
  { id: "R002", title: "高級工程師", level: "P3", department: "技術部", headcount: 45, status: "啟用", salaryRange: "40K-65K", createdAt: "2023-01-15" },
  { id: "R003", title: "工程師", level: "P2", department: "技術部", headcount: 120, status: "啟用", salaryRange: "25K-40K", createdAt: "2023-02-01" },
  { id: "R004", title: "銷售經理", level: "M2", department: "銷售部", headcount: 8, status: "啟用", salaryRange: "35K-55K", createdAt: "2023-01-20" },
  { id: "R005", title: "銷售專員", level: "P1", department: "銷售部", headcount: 90, status: "啟用", salaryRange: "15K-25K", createdAt: "2023-03-01" },
  { id: "R006", title: "產品經理", level: "P3", department: "運營部", headcount: 12, status: "啟用", salaryRange: "40K-60K", createdAt: "2023-02-10" },
  { id: "R007", title: "實習助理", level: "P0", department: "行政部", headcount: 0, status: "停用", salaryRange: "8K-12K", createdAt: "2024-06-01" },
];

const statusColors: Record<string, string> = {
  "啟用": "bg-success/10 text-success border-success/20",
  "停用": "bg-muted text-muted-foreground",
};

const levelColors: Record<string, string> = {
  "M3": "bg-primary/10 text-primary border-primary/20",
  "M2": "bg-primary/10 text-primary border-primary/20",
  "M1": "bg-primary/10 text-primary border-primary/20",
  "P3": "bg-accent/10 text-accent border-accent/20",
  "P2": "bg-accent/10 text-accent border-accent/20",
  "P1": "bg-warning/10 text-warning border-warning/20",
  "P0": "bg-muted text-muted-foreground",
};

export default function Roles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", level: "", department: "" });
  const [permissions, setPermissions] = useState<Record<string, PermLevel>>({});
  const [expandedMods, setExpandedMods] = useState<string[]>([]);

  const departments = [...new Set(rolesData.map(r => r.department))];
  const filtered = rolesData.filter(r => {
    const matchSearch = r.title.includes(search) || r.level.includes(search) || r.department.includes(search);
    const matchDept = filterDept === "all" || r.department === filterDept;
    return matchSearch && matchDept;
  });

  const totalHeadcount = rolesData.reduce((s, r) => s + r.headcount, 0);
  const activeRoles = rolesData.filter(r => r.status === "啟用").length;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            職位管理
          </h1>
          <p className="page-description">管理公司職位與職等體系</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新增職位
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "職位總數", value: rolesData.length, icon: Layers, color: "text-primary" },
          { label: "啟用中", value: activeRoles, icon: Building2, color: "text-success" },
          { label: "在職人數", value: totalHeadcount, icon: Users, color: "text-accent" },
          { label: "部門覆蓋", value: departments.length, icon: BarChart3, color: "text-warning" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`p-2 rounded-lg bg-muted`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋職位名稱、職等..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部門</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />匯出</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>職位名稱</TableHead>
                <TableHead>職等</TableHead>
                <TableHead>所屬部門</TableHead>
                
                <TableHead>在職人數</TableHead>
                <TableHead>狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(role => (
                <TableRow key={role.id} className="cursor-pointer" onClick={() => navigate(`/organization/roles/${role.id}`)}>
                  <TableCell className="font-medium">{role.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={levelColors[role.level] || ""}>{role.level}</Badge>
                  </TableCell>
                  <TableCell>{role.department}</TableCell>
                  
                  <TableCell>{role.headcount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[role.status] || ""}>{role.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog - Multi-step */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setStep(1); setForm({ title: "", level: "", department: "" }); setPermissions({}); setExpandedMods([]); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 2 && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              新增職位 — {step === 1 ? "基本資訊" : "權限設定"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? "第 1 步：填寫職位基本資訊" : "第 2 步：設定該職位的系統權限"}
            </DialogDescription>
            {/* Step indicator */}
            <div className="flex items-center gap-2 pt-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
                基本資訊
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
                權限設定
              </div>
            </div>
          </DialogHeader>

          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>職位名稱 <span className="text-destructive">*</span></Label>
                  <Input placeholder="例如：前端工程師" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>職等 <span className="text-destructive">*</span></Label>
                  <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇職等" /></SelectTrigger>
                    <SelectContent>
                      {["M3", "M2", "M1", "P3", "P2", "P1", "P0"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>所屬部門 <span className="text-destructive">*</span></Label>
                  <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇部門" /></SelectTrigger>
                    <SelectContent>
                      {["技術部", "銷售部", "運營部", "人力資源部", "財務部", "行政部"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
                <Button
                  disabled={!form.title || !form.level || !form.department}
                  onClick={() => {
                    setPermissions(getDefaultPermissions(form.level));
                    setExpandedMods(permissionModules.map(m => m.id));
                    setStep(2);
                  }}
                >
                  下一步
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    根據職等 <Badge variant="outline" className="mx-1">{form.level}</Badge> 已自動生成預設權限，您可依需求調整
                  </p>
                  <Select
                    value=""
                    onValueChange={(v: PermLevel) => {
                      const updated = { ...permissions };
                      Object.keys(updated).forEach(k => updated[k] = v);
                      setPermissions(updated);
                    }}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue placeholder="批量設定" />
                    </SelectTrigger>
                    <SelectContent>
                      {permLevels.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className={p.color}>{p.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {permissionModules.map(mod => {
                  const isExpanded = expandedMods.includes(mod.id);
                  const ModIcon = mod.icon;
                  return (
                    <Card key={mod.id} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedMods(prev => isExpanded ? prev.filter(id => id !== mod.id) : [...prev, mod.id])}
                      >
                        <div className="flex items-center gap-2">
                          <ModIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{mod.name}</span>
                          <Badge variant="secondary" className="text-xs">{mod.children.length} 項</Badge>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                      {isExpanded && (
                        <div className="border-t">
                          {mod.children.map(child => {
                            const level = permissions[child.id] || "none";
                            const info = permLevels.find(p => p.value === level)!;
                            const LevelIcon = info.icon;
                            return (
                              <div key={child.id} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 hover:bg-muted/30">
                                <span className="text-sm">{child.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <LevelIcon className={`h-3.5 w-3.5 ${info.color}`} />
                                  <Select value={level} onValueChange={(v: PermLevel) => setPermissions({ ...permissions, [child.id]: v })}>
                                    <SelectTrigger className="w-[110px] h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {permLevels.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                          <span className={p.color}>{p.label}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              <DialogFooter className="pt-3 border-t">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  上一步
                </Button>
                <Button onClick={() => {
                  setAddOpen(false);
                  setStep(1);
                  setForm({ title: "", level: "", department: "" });
                  setPermissions({});
                  toast({ title: "新增成功", description: `職位「${form.title}」已建立並完成權限設定` });
                }}>
                  確認新增
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
