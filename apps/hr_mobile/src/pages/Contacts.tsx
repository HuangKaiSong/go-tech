import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Briefcase, Building2, ChevronDown, ChevronRight,
  Loader2, MapPin, MessageCircle, Phone, PhoneCall, PhoneOff, Search, User, Users
} from "lucide-react";
import {
  type DirectoryEmployee, type OrgDeptNode, getEmployeeDetailById,
  getEmployeeDirectory, getOrgTree,
} from "@/api/employee";

/** 页面内使用的员工结构（由后端 DirectoryEmployee 映射而来） */
type Employee = {
  avatar: string;
  dept: string;
  id: string;
  isManager?: boolean;
  name: string;
  phone: string;
  title: string;
};

/** 主管职称关键字：用于展示「主管」徽章（后端无该标志，按职称推断，仅影响展示） */
const MANAGER_KEYWORDS = ["經理", "主管", "總監", "總經理", "負責人", "董事"];
const isManagerTitle = (title: string) => MANAGER_KEYWORDS.some((k) => title.includes(k));

const mapEmployee = (e: DirectoryEmployee): Employee => ({
  id: String(e.id),
  name: e.name ?? "",
  avatar: (e.name ?? "?").charAt(0),
  dept: e.department || "未分配",
  title: e.position || "",
  isManager: isManagerTitle(e.position || ""),
  phone: e.phone || "",
});

// ── Employee Card ──
const EmployeeCard = ({ emp, onClick }: { emp: Employee; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:bg-muted transition-colors text-left">
    <Avatar className="w-12 h-12">
      <AvatarFallback className={`text-sm font-semibold ${emp.isManager ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
        {emp.avatar}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{emp.name}</span>
        {emp.isManager && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">主管</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{[emp.title, emp.dept].filter(Boolean).join(" · ")}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

// ── Employee Detail ──
const EmployeeDetail = ({ colleagues, emp, onBack, onCall, onChat }: {
  colleagues: Employee[]; emp: Employee; onBack: () => void; onCall: () => void; onChat: () => void;
}) => {
  // 详情按需拉 email / 地址（列表接口不含）
  const { data: detail } = useQuery({
    queryKey: ["empDetail", emp.id],
    queryFn: async () => (await getEmployeeDetailById(Number(emp.id))).data,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <h1 className="text-base font-semibold text-foreground">個人資料</h1>
        </div>
      </header>
      <div className="px-5 pt-6">
        {/* Profile header */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">{emp.avatar}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground">{emp.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{emp.title}</p>
          {emp.isManager && (
            <span className="mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">部門主管</span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-8 mb-6">
          <button onClick={onChat} className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-foreground">發訊息</span>
          </button>
          <button onClick={onCall} disabled={!emp.phone} className="flex flex-col items-center gap-1.5 disabled:opacity-40">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-success" />
            </div>
            <span className="text-xs text-foreground">打電話</span>
          </button>
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">聯繫方式</h3>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">電話</p>
                <p className="text-sm text-foreground">{emp.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">郵箱</p>
                <p className="text-sm text-foreground">{detail?.email || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">工作資訊</h3>
            <Separator />
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">部門</p>
                <p className="text-sm text-foreground">{emp.dept}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">職位</p>
                <p className="text-sm text-foreground">{emp.title || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">通訊地址</p>
                <p className="text-sm text-foreground">{detail?.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Same dept colleagues */}
          {colleagues.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">同部門同事</h3>
              <div className="space-y-2">
                {colleagues.map((colleague) => (
                  <div key={colleague.id} className="flex items-center gap-2.5 py-1">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-muted">{colleague.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{colleague.name}</p>
                      <p className="text-[11px] text-muted-foreground">{colleague.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Org Chart ──
const OrgNode = ({ dept, directory, level = 0, onSelectEmp }: {
  dept: OrgDeptNode; directory: Employee[]; level?: number; onSelectEmp: (emp: Employee) => void;
}) => {
  const [expanded, setExpanded] = useState(level === 0);
  const deptMembers = directory.filter((e) => e.dept === dept.name);
  const children = dept.children ?? [];

  return (
    <div className={`${level > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border mb-2 active:bg-muted transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${level === 0 ? "bg-primary" : "bg-accent"}`}>
          {level === 0 ? <Building2 className="w-5 h-5 text-primary-foreground" /> : <Users className="w-5 h-5 text-accent-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{dept.name}</p>
          <p className="text-xs text-muted-foreground">在職 {dept.memberCount ?? deptMembers.length} 人</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <>
          {children.map((child) => (
            <OrgNode key={child.id} dept={child} directory={directory} level={level + 1} onSelectEmp={onSelectEmp} />
          ))}
          {deptMembers.length > 0 && (
            <div className="ml-4 space-y-1.5 mb-2">
              {deptMembers.map((emp) => (
                <EmployeeCard key={emp.id} emp={emp} onClick={() => onSelectEmp(emp)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main Contacts Page ──
const Contacts = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"detail" | "main">("main");
  const [tab, setTab] = useState<"org" | "people">("people");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("全部");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);

  const { data: dirRaw = [], isLoading: dirLoading } = useQuery({
    queryKey: ["empDirectory"],
    queryFn: async () => (await getEmployeeDirectory()).data?.records ?? [],
  });
  const { data: orgTree = [], isLoading: orgLoading } = useQuery({
    queryKey: ["orgTree"],
    queryFn: async () => (await getOrgTree()).data ?? [],
  });

  const employees = useMemo(() => dirRaw.map(mapEmployee), [dirRaw]);
  const departments = useMemo(
    () => ["全部", ...Array.from(new Set(employees.map((e) => e.dept)))],
    [employees],
  );

  const filtered = employees
    .filter((e) => deptFilter === "全部" || e.dept === deptFilter)
    .filter((e) => e.name.includes(search) || e.dept.includes(search) || e.title.includes(search));

  const grouped = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    (acc[e.dept] = acc[e.dept] || []).push(e);
    return acc;
  }, {});

  if (view === "detail" && selectedEmp) {
    const colleagues = employees.filter((e) => e.dept === selectedEmp.dept && e.id !== selectedEmp.id);
    return (
      <>
        <EmployeeDetail
          emp={selectedEmp}
          colleagues={colleagues}
          onBack={() => setView("main")}
          onChat={() => navigate(`/notifications?tab=chat&contactId=${selectedEmp.id}`)}
          onCall={() => setShowCallDialog(true)}
        />
        <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
          <DialogContent className="max-w-[300px] rounded-2xl text-center">
            <DialogHeader className="items-center">
              <Avatar className="w-16 h-16 mb-2">
                <AvatarFallback className="text-xl font-bold bg-primary/15 text-primary">{selectedEmp.avatar}</AvatarFallback>
              </Avatar>
              <DialogTitle>{selectedEmp.name}</DialogTitle>
              <DialogDescription>{selectedEmp.phone || "無電話"}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-6 pt-2">
              <a href={`tel:${selectedEmp.phone}`} className={`flex flex-col items-center gap-1.5 ${selectedEmp.phone ? "" : "pointer-events-none opacity-40"}`}>
                <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-foreground">撥打</span>
              </a>
              <button onClick={() => setShowCallDialog(false)} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center">
                  <PhoneOff className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-foreground">取消</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <MobileLayout title="通訊錄">
      <div className="px-5 pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、部門、職位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl"
          />
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("people")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "people" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            人員列表
          </button>
          <button
            onClick={() => setTab("org")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "org" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            組織架構
          </button>
        </div>

        {tab === "people" ? (
          <>
            {/* Department filter */}
            <ScrollArea className="mb-4">
              <div className="flex gap-2 pb-1">
                {departments.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeptFilter(d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      deptFilter === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Stats */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">共 {filtered.length} 人</span>
            </div>

            {/* Grouped list */}
            {dirLoading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {Object.entries(grouped).map(([dept, members]) => (
                  <div key={dept}>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">{dept}</span>
                      <span className="text-[10px] text-muted-foreground/60">({members.length})</span>
                    </div>
                    <div className="space-y-2">
                      {members.map((emp) => (
                        <EmployeeCard
                          key={emp.id}
                          emp={emp}
                          onClick={() => { setSelectedEmp(emp); setView("detail"); }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">未找到匹配的人員</div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Org chart */
          <div className="pb-4">
            <div className="bg-muted/50 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">點擊部門展開查看人員列表</span>
            </div>
            {orgLoading && (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {!orgLoading && orgTree.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">暫無組織架構資料</div>
            )}
            {!orgLoading && orgTree.length > 0 && (
              orgTree.map((dept) => (
                <OrgNode
                  key={dept.id}
                  dept={dept}
                  directory={employees}
                  onSelectEmp={(emp) => { setSelectedEmp(emp); setView("detail"); }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Contacts;
