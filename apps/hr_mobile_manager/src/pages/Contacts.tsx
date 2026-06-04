import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Search, ArrowLeft, Phone, MessageCircle, ChevronRight,
  ChevronDown, Building2, Users, User, Briefcase, MapPin, PhoneCall, PhoneOff
} from "lucide-react";

// ── Organization Data ──
type Employee = {
  id: string;
  name: string;
  avatar: string;
  dept: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  isManager?: boolean;
  online?: boolean;
};

type Department = {
  id: string;
  name: string;
  manager: string;
  memberCount: number;
  children?: Department[];
};

const employees: Employee[] = [
  { id: "1", name: "張經理", avatar: "張", dept: "人力資源部", title: "HR 經理", phone: "9567-8901", email: "zhang@company.com", location: "台北總部 8F", isManager: true, online: true },
  { id: "2", name: "李美玲", avatar: "李", dept: "人力資源部", title: "HR 專員", phone: "9234-5678", email: "li@company.com", location: "台北總部 8F", online: false },
  { id: "3", name: "陳大華", avatar: "陳", dept: "技術開發部", title: "技術主管", phone: "9345-6789", email: "chen@company.com", location: "台北總部 10F", isManager: true, online: true },
  { id: "4", name: "王小明", avatar: "王", dept: "技術開發部", title: "前端工程師", phone: "9123-4567", email: "wang@company.com", location: "台北總部 10F", online: true },
  { id: "5", name: "劉工", avatar: "劉", dept: "技術開發部", title: "後端工程師", phone: "9678-9012", email: "liu@company.com", location: "台北總部 10F", online: false },
  { id: "6", name: "趙博", avatar: "趙", dept: "技術開發部", title: "測試工程師", phone: "9789-0123", email: "zhao@company.com", location: "台北總部 10F", online: true },
  { id: "7", name: "林志明", avatar: "林", dept: "市場營銷部", title: "市場經理", phone: "9456-7890", email: "lin@company.com", location: "台北總部 6F", isManager: true, online: false },
  { id: "8", name: "黃麗", avatar: "黃", dept: "財務部", title: "財務專員", phone: "9890-1234", email: "huang@company.com", location: "台北總部 7F", online: true },
  { id: "9", name: "周明", avatar: "周", dept: "財務部", title: "財務經理", phone: "9901-2345", email: "zhou@company.com", location: "台北總部 7F", isManager: true, online: false },
  { id: "10", name: "吳芳", avatar: "吳", dept: "市場營銷部", title: "品牌專員", phone: "9012-3456", email: "wu@company.com", location: "台北總部 6F", online: true },
  { id: "11", name: "鄭總", avatar: "鄭", dept: "管理層", title: "總經理", phone: "9111-0000", email: "zheng@company.com", location: "台北總部 12F", isManager: true, online: true },
  { id: "12", name: "孫副總", avatar: "孫", dept: "管理層", title: "副總經理", phone: "9111-0001", email: "sun@company.com", location: "台北總部 12F", isManager: true, online: false },
];

const orgStructure: Department[] = [
  {
    id: "company", name: "XX科技有限公司", manager: "鄭總", memberCount: employees.length,
    children: [
      { id: "mgmt", name: "管理層", manager: "鄭總", memberCount: 2 },
      { id: "hr", name: "人力資源部", manager: "張經理", memberCount: 2 },
      { id: "tech", name: "技術開發部", manager: "陳大華", memberCount: 4 },
      { id: "mkt", name: "市場營銷部", manager: "林志明", memberCount: 2 },
      { id: "fin", name: "財務部", manager: "周明", memberCount: 2 },
    ],
  },
];

const departments = ["全部", "管理層", "人力資源部", "技術開發部", "市場營銷部", "財務部"];

// ── Employee Card ──
const EmployeeCard = ({ emp, onClick }: { emp: Employee; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:bg-muted transition-colors text-left">
    <div className="relative">
      <Avatar className="w-12 h-12">
        <AvatarFallback className={`text-sm font-semibold ${emp.isManager ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
          {emp.avatar}
        </AvatarFallback>
      </Avatar>
      {emp.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{emp.name}</span>
        {emp.isManager && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">主管</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{emp.title} · {emp.dept}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

// ── Employee Detail ──
const EmployeeDetail = ({ emp, onBack, onChat, onCall }: { emp: Employee; onBack: () => void; onChat: () => void; onCall: () => void }) => (
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
        <div className="relative mb-3">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">{emp.avatar}</AvatarFallback>
          </Avatar>
          {emp.online && <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-background" />}
        </div>
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
        <button onClick={onCall} className="flex flex-col items-center gap-1.5">
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
              <p className="text-sm text-foreground">{emp.phone}</p>
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
              <p className="text-sm text-foreground">{emp.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">辦公地點</p>
              <p className="text-sm text-foreground">{emp.location}</p>
            </div>
          </div>
        </div>

        {/* Same dept colleagues */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">同部門同事</h3>
          <div className="space-y-2">
            {employees.filter(e => e.dept === emp.dept && e.id !== emp.id).map(colleague => (
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
      </div>
    </div>
  </div>
);

// ── Org Chart ──
const OrgNode = ({ dept, level = 0, onSelectEmp }: { dept: Department; level?: number; onSelectEmp: (emp: Employee) => void }) => {
  const [expanded, setExpanded] = useState(level === 0);
  const deptMembers = employees.filter(e => e.dept === dept.name);
  const hasChildren = !!dept.children;
  const isLeaf = !hasChildren;

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
          <p className="text-xs text-muted-foreground">負責人：{dept.manager} · {dept.memberCount}人</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <>
          {hasChildren && dept.children!.map(child => (
            <OrgNode key={child.id} dept={child} level={level + 1} onSelectEmp={onSelectEmp} />
          ))}
          {isLeaf && deptMembers.length > 0 && (
            <div className="ml-4 space-y-1.5 mb-2">
              {deptMembers.map(emp => (
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
  const [view, setView] = useState<"main" | "detail">("main");
  const [tab, setTab] = useState<"people" | "org">("people");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("全部");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const filtered = employees
    .filter(e => deptFilter === "全部" || e.dept === deptFilter)
    .filter(e => e.name.includes(search) || e.dept.includes(search) || e.title.includes(search));

  // Group by department
  const grouped = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    (acc[e.dept] = acc[e.dept] || []).push(e);
    return acc;
  }, {});

  const handleOrgDeptClick = (deptName: string) => {
    setTab("people");
    setDeptFilter(deptName);
  };

  const [showCallDialog, setShowCallDialog] = useState(false);
  const navigate = useNavigate();

  if (view === "detail" && selectedEmp) {
    return (
      <>
        <EmployeeDetail
          emp={selectedEmp}
          onBack={() => setView("main")}
          onChat={() => {
            navigate("/notifications?tab=chat&contact=" + encodeURIComponent(selectedEmp.name));
          }}
          onCall={() => setShowCallDialog(true)}
        />
        {/* Call Dialog */}
        <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
          <DialogContent className="max-w-[300px] rounded-2xl text-center">
            <DialogHeader className="items-center">
              <Avatar className="w-16 h-16 mb-2">
                <AvatarFallback className="text-xl font-bold bg-primary/15 text-primary">{selectedEmp.avatar}</AvatarFallback>
              </Avatar>
              <DialogTitle>{selectedEmp.name}</DialogTitle>
              <DialogDescription>{selectedEmp.phone}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-6 pt-2">
              <a href={`tel:${selectedEmp.phone}`} className="flex flex-col items-center gap-1.5">
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
            onChange={e => setSearch(e.target.value)}
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
                {departments.map(d => (
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
              <span className="text-xs text-muted-foreground">
                共 {filtered.length} 人 · {filtered.filter(e => e.online).length} 人在線
              </span>
            </div>

            {/* Grouped list */}
            <div className="space-y-4 pb-4">
              {Object.entries(grouped).map(([dept, members]) => (
                <div key={dept}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">{dept}</span>
                    <span className="text-[10px] text-muted-foreground/60">({members.length})</span>
                  </div>
                  <div className="space-y-2">
                    {members.map(emp => (
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
                <div className="text-center py-12 text-muted-foreground text-sm">
                  未找到匹配的人員
                </div>
              )}
            </div>
          </>
        ) : (
          /* Org chart */
          <div className="pb-4">
            <div className="bg-muted/50 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">點擊部門展開查看人員列表</span>
            </div>
            {orgStructure.map(dept => (
              <OrgNode key={dept.id} dept={dept} onSelectEmp={(emp) => { setSelectedEmp(emp); setView("detail"); }} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Contacts;
