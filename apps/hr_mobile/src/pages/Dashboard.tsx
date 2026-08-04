import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import {
  BarChart3, Bell, BookUser, CalendarDays, CheckCircle2, ChevronRight,
  Clock, DollarSign, FileText, GraduationCap, MapPin, User
} from "lucide-react";
import { APPROVAL_TYPE_TEXT, getMyPending } from "@/api/approval";
import { getMyProfile } from "@/api/employee";
import { getTodayClock } from "@/api/attendance";

const greetingFor = (hours: number) => {
  if (hours < 12) return "早安";
  if (hours < 18) return "午安";
  return "晚安";
};

const quickActions = [
  { icon: Clock, label: "打卡", path: "/clock", color: "bg-primary" },
  { icon: FileText, label: "請假", path: "/applications", color: "bg-accent" },
  { icon: DollarSign, label: "薪酬", path: "/salary", color: "bg-warning" },
  { icon: BarChart3, label: "KPI", path: "/kpi", color: "bg-info" },
  { icon: GraduationCap, label: "培訓", path: "/training", color: "bg-[hsl(var(--info))]" },
  { icon: BookUser, label: "通訊錄", path: "/contacts", color: "bg-accent" },
  { icon: User, label: "個人資料", path: "/profile", color: "bg-success" },
  { icon: Bell, label: "通知", path: "/notifications", color: "bg-destructive" },
];

// oxlint-disable-next-line complexity
const Dashboard = () => {
  const navigate = useNavigate();
  const now = new Date();
  const greeting = greetingFor(now.getHours());

  // 待辦事項 = 待我審批的單據
  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["myPending"],
    queryFn: async () => (await getMyPending()).data ?? [],
  });
  const todoItems = pending.slice(0, 5);

  // 当前登录员工 + 今日打卡状态
  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => (await getMyProfile()).data,
  });
  const { data: today } = useQuery({
    queryKey: ["todayClock"],
    queryFn: async () => (await getTodayClock()).data,
  });
  let workHours = "--";
  if (today && today.hoursWorked !== null) {
    workHours = `${today.hoursWorked} 小時`;
  } else if (today?.clockIn && !today?.clockOut) {
    workHours = "進行中";
  }

  return (
    <MobileLayout>
      {/* Top header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 dark:from-[hsl(220,25%,14%)] dark:to-[hsl(220,20%,18%)] px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">{greeting}，</p>
            <h2 className="text-xl font-bold text-primary-foreground">{profile?.name ?? "　"}</h2>
          </div>
          <button onClick={() => navigate("/profile")} className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center active:scale-95 transition-transform">
            <User className="w-6.5 h-6.5 text-primary-foreground" />
          </button>
        </div>

        {/* Today status card */}
        <div className="bg-primary-foreground/10 dark:bg-[hsl(220,20%,20%)]/60 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <span className="text-sm">{now.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "short" })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-[18px] h-[18px]" />
              <span>{today?.locationName ?? "—"}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">上班打卡</p>
              <p className="text-lg font-semibold text-primary-foreground">{today?.clockIn ?? "--:--"}</p>
            </div>
            <div className="w-px h-8 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">下班打卡</p>
              <p className="text-lg font-semibold text-primary-foreground">{today?.clockOut ?? "--:--"}</p>
            </div>
            <div className="w-px h-8 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">工時</p>
              <p className="text-lg font-semibold text-primary-foreground">{workHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-xl ${action.color} dark:opacity-80 flex items-center justify-center`}>
                  <action.icon className="w-6.5 h-6.5 text-primary-foreground dark:text-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pending section */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">待辦事項</h3>
          <button onClick={() => navigate("/applications")} className="flex items-center text-xs text-primary">
            查看全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {pendingLoading && [0, 1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3.5">
              <div className="h-4 w-2/5 bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/5 bg-muted rounded animate-pulse mt-2" />
            </div>
          ))}
          {!pendingLoading && todoItems.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 opacity-40" />
              <p className="text-sm">暫無待辦事項</p>
            </div>
          )}
          {!pendingLoading && todoItems.length > 0 && (
            todoItems.map((item) => {
              const title = item.typeName ?? APPROVAL_TYPE_TEXT[item.type] ?? "審批申請";
              const subtitle = [item.applicantName, item.summary].filter(Boolean).join(" · ");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate("/applications")}
                  className="w-full text-left bg-card rounded-xl border border-border p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle || "—"}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-warning/10 text-warning">
                    待審批
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
