import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2, ArrowLeft, Edit2, Save, X, Users, FileText,
  GraduationCap, Target, Clock, DollarSign, ChevronRight, Mail, Phone,
  Shield, Eye, Pencil, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface RoleData {
  id: string; title: string; level: string; department: string;
  headcount: number; status: string; salaryRange: string;
  createdAt: string; updatedAt: string;
}

const rolesDB: Record<string, RoleData> = {
  R001: {
    id: "R001", title: "技術總監", level: "M3", department: "技術部",
    headcount: 1, status: "啟用", salaryRange: "80K-120K",
    createdAt: "2023-01-15", updatedAt: "2025-02-20",
  },
  R002: {
    id: "R002", title: "高級工程師", level: "P3", department: "技術部",
    headcount: 45, status: "啟用", salaryRange: "40K-65K",
    createdAt: "2023-01-15", updatedAt: "2025-01-10",
  },
  R003: {
    id: "R003", title: "工程師", level: "P2", department: "技術部",
    headcount: 120, status: "啟用", salaryRange: "25K-40K",
    createdAt: "2023-02-01", updatedAt: "2025-03-01",
  },
  R004: {
    id: "R004", title: "銷售經理", level: "M2", department: "銷售部",
    headcount: 8, status: "啟用", salaryRange: "35K-55K",
    createdAt: "2023-01-20", updatedAt: "2025-02-15",
  },
  R005: {
    id: "R005", title: "銷售專員", level: "P1", department: "銷售部",
    headcount: 90, status: "啟用", salaryRange: "15K-25K",
    createdAt: "2023-03-01", updatedAt: "2025-01-20",
  },
  R006: {
    id: "R006", title: "產品經理", level: "P3", department: "運營部",
    headcount: 12, status: "啟用", salaryRange: "40K-60K",
    createdAt: "2023-02-10", updatedAt: "2025-02-28",
  },
  R007: {
    id: "R007", title: "實習助理", level: "P0", department: "行政部",
    headcount: 0, status: "停用", salaryRange: "8K-12K",
    createdAt: "2024-06-01", updatedAt: "2025-01-01",
  },
};

const membersDB: Record<string, { name: string; empId: string; joinDate: string; status: string; email: string; phone: string }[]> = {
  R001: [{ name: "王大明", empId: "EMP001", joinDate: "2020-03-15", status: "在職", email: "wang@company.com", phone: "0912-345-678" }],
  R002: [
    { name: "陳美玲", empId: "EMP010", joinDate: "2021-06-01", status: "在職", email: "chen@company.com", phone: "0923-456-789" },
    { name: "林志偉", empId: "EMP011", joinDate: "2022-01-10", status: "在職", email: "lin@company.com", phone: "0934-567-890" },
    { name: "張雅婷", empId: "EMP012", joinDate: "2022-08-20", status: "在職", email: "zhang@company.com", phone: "0945-678-901" },
    { name: "李建國", empId: "EMP013", joinDate: "2023-03-05", status: "試用期", email: "li@company.com", phone: "0956-789-012" },
  ],
  R003: [
    { name: "吳佳蓉", empId: "EMP020", joinDate: "2023-05-15", status: "在職", email: "wu@company.com", phone: "0967-890-123" },
    { name: "黃柏翰", empId: "EMP021", joinDate: "2023-09-01", status: "在職", email: "huang@company.com", phone: "0978-901-234" },
    { name: "趙小敏", empId: "EMP022", joinDate: "2024-01-15", status: "試用期", email: "zhao@company.com", phone: "0989-012-345" },
  ],
  R004: [
    { name: "劉曉峰", empId: "EMP030", joinDate: "2021-04-10", status: "在職", email: "liu@company.com", phone: "0911-111-222" },
    { name: "周芷涵", empId: "EMP031", joinDate: "2022-07-01", status: "在職", email: "zhou@company.com", phone: "0922-222-333" },
  ],
  R005: [
    { name: "鄭宇軒", empId: "EMP040", joinDate: "2023-06-15", status: "在職", email: "zheng@company.com", phone: "0933-333-444" },
    { name: "蔡雨彤", empId: "EMP041", joinDate: "2024-02-01", status: "在職", email: "cai@company.com", phone: "0944-444-555" },
  ],
  R006: [
    { name: "許家豪", empId: "EMP050", joinDate: "2022-03-20", status: "在職", email: "xu@company.com", phone: "0955-555-666" },
    { name: "楊心怡", empId: "EMP051", joinDate: "2023-08-10", status: "在職", email: "yang@company.com", phone: "0966-666-777" },
  ],
  R007: [],
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

const statusMemberColors: Record<string, string> = {
  "在職": "bg-success/10 text-success border-success/20",
  "試用期": "bg-warning/10 text-warning border-warning/20",
  "離職": "bg-destructive/10 text-destructive border-destructive/20",
};

// Permission modules definition
interface PermissionModule {
  id: string;
  name: string;
  icon: typeof Shield;
  children: { id: string; name: string }[];
}

const permissionModules: PermissionModule[] = [
  {
    id: "employee", name: "員工管理", icon: Users,
    children: [
      { id: "employee.list", name: "員工列表" },
      { id: "employee.detail", name: "員工詳情" },
      { id: "employee.onboard", name: "入職管理" },
      { id: "employee.offboard", name: "離職管理" },
      { id: "employee.self", name: "員工自助" },
    ],
  },
  {
    id: "attendance", name: "行政管理", icon: Clock,
    children: [
      { id: "attendance.records", name: "考勤記錄" },
      { id: "attendance.leave", name: "請假管理" },
      { id: "attendance.overtime", name: "加班管理" },
      { id: "attendance.approval", name: "審批管理" },
    ],
  },
  {
    id: "payroll", name: "薪資管理", icon: DollarSign,
    children: [
      { id: "payroll.structure", name: "薪資結構" },
      { id: "payroll.calculate", name: "薪資計算" },
      { id: "payroll.distribute", name: "薪資發放" },
    ],
  },
  {
    id: "performance", name: "績效管理", icon: Target,
    children: [
      { id: "performance.evaluation", name: "績效評估" },
      { id: "performance.plans", name: "績效計劃" },
    ],
  },
  {
    id: "training", name: "培訓管理", icon: GraduationCap,
    children: [
      { id: "training.plans", name: "培訓計劃" },
      { id: "training.records", name: "培訓記錄" },
    ],
  },
  {
    id: "organization", name: "組織架構", icon: Building2,
    children: [
      { id: "organization.dept", name: "部門管理" },
      { id: "organization.role", name: "職位管理" },
      { id: "organization.chart", name: "組織圖" },
    ],
  },
  {
    id: "system", name: "系統管理", icon: Shield,
    children: [
      { id: "system.settings", name: "系統設定" },
      { id: "system.permissions", name: "權限管理" },
      { id: "system.logs", name: "操作日誌" },
    ],
  },
];

type PermLevel = "none" | "view" | "edit" | "full";

const permLevelLabels: Record<PermLevel, { label: string; color: string; icon: typeof Eye }> = {
  none: { label: "無權限", color: "text-muted-foreground", icon: Lock },
  view: { label: "僅查看", color: "text-accent", icon: Eye },
  edit: { label: "可編輯", color: "text-warning", icon: Pencil },
  full: { label: "完全控制", color: "text-success", icon: Shield },
};

// Default permissions by level
const getDefaultPermissions = (level: string): Record<string, PermLevel> => {
  const perms: Record<string, PermLevel> = {};
  const isManager = level.startsWith("M");
  const rank = parseInt(level[1]);

  permissionModules.forEach(mod => {
    mod.children.forEach(child => {
      if (isManager && rank >= 2) {
        perms[child.id] = "full";
      } else if (isManager) {
        perms[child.id] = child.id.startsWith("system") ? "view" : "full";
      } else if (rank >= 3) {
        perms[child.id] = child.id.startsWith("system") ? "none" : "edit";
      } else if (rank >= 2) {
        perms[child.id] = child.id.startsWith("system") || child.id.startsWith("payroll") ? "none" : "view";
      } else {
        perms[child.id] = child.id.startsWith("employee.self") || child.id.startsWith("attendance.records") ? "view" : "none";
      }
    });
  });
  return perms;
};

const sections = [
  { id: "basic", label: "基本資訊", icon: FileText },
  { id: "members", label: "在職人員", icon: Users },
  { id: "permissions", label: "系統權限", icon: Shield },
];

export default function RoleDetail() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("basic");
  const [editing, setEditing] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<(typeof membersDB)["R001"][0] | null>(null);

  const role = rolesDB[roleId || ""];
  const members = membersDB[roleId || ""] || [];
  const [formData, setFormData] = useState<RoleData>({ ...(role || rolesDB["R001"]) });
  const [permissions, setPermissions] = useState<Record<string, PermLevel>>(
    getDefaultPermissions(role?.level || "P1")
  );
  const [permEditing, setPermEditing] = useState(false);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">找不到該職位</p>
        <Button variant="outline" onClick={() => navigate("/organization/roles")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回職位列表
        </Button>
      </div>
    );
  }

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const setModulePermission = (moduleId: string, level: PermLevel) => {
    const mod = permissionModules.find(m => m.id === moduleId);
    if (!mod) return;
    const updated = { ...permissions };
    mod.children.forEach(c => { updated[c.id] = level; });
    setPermissions(updated);
  };

  const getModuleLevel = (moduleId: string): PermLevel | "mixed" => {
    const mod = permissionModules.find(m => m.id === moduleId);
    if (!mod) return "none";
    const levels = mod.children.map(c => permissions[c.id] || "none");
    if (levels.every(l => l === levels[0])) return levels[0] as PermLevel;
    return "mixed";
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/organization/roles")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{role.title}</h1>
              <Badge variant="outline" className={levelColors[role.level] || ""}>{role.level}</Badge>
              <Badge variant="secondary" className={role.status === "啟用" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                {role.status}
              </Badge>
            </div>
            <p className="page-description">{role.department} · 建立於 {role.createdAt}</p>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setFormData({ ...role }); }}>
              <X className="h-4 w-4 mr-1" />取消
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              <Save className="h-4 w-4 mr-1" />儲存
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />編輯
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="hidden md:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Basic Info */}
          <Card id="basic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" /> 基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "職位名稱", key: "title" as const },
                  { label: "職等", key: "level" as const },
                  { label: "所屬部門", key: "department" as const },
                  { label: "薪資範圍", key: "salaryRange" as const },
                  { label: "在職人數", key: "headcount" as const },
                  { label: "狀態", key: "status" as const },
                  { label: "建立日期", key: "createdAt" as const },
                  { label: "最後更新", key: "updatedAt" as const },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <p className="text-sm text-muted-foreground">{field.label}</p>
                    {editing && !["headcount", "createdAt", "updatedAt"].includes(field.key) ? (
                      field.key === "status" ? (
                        <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="啟用">啟用</SelectItem>
                            <SelectItem value="停用">停用</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : field.key === "level" ? (
                        <Select value={formData.level} onValueChange={v => setFormData({ ...formData, level: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["M3","M2","M1","P3","P2","P1","P0"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : field.key === "department" ? (
                        <Select value={formData.department} onValueChange={v => setFormData({ ...formData, department: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["技術部", "銷售部", "運營部", "人力資源部", "財務部", "行政部"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={String(formData[field.key])} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                      )
                    ) : (
                      <p className="font-medium">{String(role[field.key])}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Members */}
          <Card id="members">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> 在職人員
                  <Badge variant="secondary" className="ml-1">{members.length}</Badge>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">目前無在職人員</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>工號</TableHead>
                      <TableHead>到職日期</TableHead>
                      <TableHead>狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.empId} className="cursor-pointer" onClick={() => { setSelectedMember(m); setMemberDialogOpen(true); }}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.name.slice(-2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{m.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.empId}</TableCell>
                        <TableCell className="text-muted-foreground">{m.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusMemberColors[m.status] || ""}>{m.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>


          {/* Permissions */}
          <Card id="permissions">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> 系統權限配置
                </span>
                {permEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setPermEditing(false); setPermissions(getDefaultPermissions(role.level)); }}>
                      <X className="h-4 w-4 mr-1" />取消
                    </Button>
                    <Button size="sm" onClick={() => setPermEditing(false)}>
                      <Save className="h-4 w-4 mr-1" />儲存權限
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setPermEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />編輯權限
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">功能模組</TableHead>
                    <TableHead className="w-[180px]">子功能</TableHead>
                    <TableHead className="text-center">無權限</TableHead>
                    <TableHead className="text-center">僅查看</TableHead>
                    <TableHead className="text-center">可編輯</TableHead>
                    <TableHead className="text-center">完全控制</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionModules.map(mod => {
                    const modLevel = getModuleLevel(mod.id);
                    return (
                      <>
                        {/* Module header row */}
                        <TableRow key={mod.id} className="bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <mod.icon className="h-4 w-4 text-primary" />
                              {mod.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {modLevel === "mixed" ? (
                              <Badge variant="outline" className="text-xs">混合權限</Badge>
                            ) : (
                              <Badge variant="outline" className={`text-xs ${permLevelLabels[modLevel].color}`}>
                                {permLevelLabels[modLevel].label}
                              </Badge>
                            )}
                          </TableCell>
                          {(["none", "view", "edit", "full"] as PermLevel[]).map(level => (
                            <TableCell key={level} className="text-center">
                              {permEditing && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setModulePermission(mod.id, level)}
                                >
                                  全選
                                </Button>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {/* Child rows */}
                        {mod.children.map(child => {
                          const currentLevel = permissions[child.id] || "none";
                          return (
                            <TableRow key={child.id}>
                              <TableCell />
                              <TableCell className="text-sm">{child.name}</TableCell>
                              {(["none", "view", "edit", "full"] as PermLevel[]).map(level => {
                                const meta = permLevelLabels[level];
                                return (
                                  <TableCell key={level} className="text-center">
                                    {permEditing ? (
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={currentLevel === level}
                                          onCheckedChange={() => setPermissions({ ...permissions, [child.id]: level })}
                                        />
                                      </div>
                                    ) : (
                                      currentLevel === level && (
                                        <div className={`flex justify-center ${meta.color}`}>
                                          <meta.icon className="h-4 w-4" />
                                        </div>
                                      )
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>員工資訊</DialogTitle>
            <DialogDescription>查看該員工的基本資料</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">{selectedMember.name.slice(-2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{role.title} · {role.department}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">工號</p><p className="font-medium">{selectedMember.empId}</p></div>
                <div><p className="text-muted-foreground">狀態</p><Badge variant="outline" className={statusMemberColors[selectedMember.status] || ""}>{selectedMember.status}</Badge></div>
                <div><p className="text-muted-foreground">到職日期</p><p className="font-medium">{selectedMember.joinDate}</p></div>
                <div><p className="text-muted-foreground">職等</p><Badge variant="outline" className={levelColors[role.level] || ""}>{role.level}</Badge></div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedMember.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedMember.phone}</div>
              </div>
              <Button className="w-full" variant="outline" onClick={() => { setMemberDialogOpen(false); navigate(`/employees/${selectedMember.empId}`); }}>
                查看完整員工檔案 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
