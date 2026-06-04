import { Users, UserPlus, Clock, DollarSign, TrendingUp, TrendingDown, UserCheck, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const stats = [
  { label: "總員工數", value: "1,284", change: "+12", trend: "up", icon: Users, color: "text-primary" },
  { label: "本月新入職", value: "23", change: "+5", trend: "up", icon: UserPlus, color: "text-accent" },
  { label: "本月離職", value: "8", change: "-2", trend: "down", icon: UserCheck, color: "text-warning" },
  { label: "出勤率", value: "96.5%", change: "+0.3%", trend: "up", icon: Clock, color: "text-success" },
];

const departmentData = [
  { name: "技術部", count: 320 },
  { name: "銷售部", count: 240 },
  { name: "市場部", count: 180 },
  { name: "人事部", count: 80 },
  { name: "財務部", count: 120 },
  { name: "運營部", count: 200 },
  { name: "客服部", count: 144 },
];

const genderData = [
  { name: "男性", value: 720, color: "hsl(215, 70%, 45%)" },
  { name: "女性", value: 564, color: "hsl(200, 75%, 45%)" },
];

const monthlyTrend = [
  { month: "1月", 入職: 15, 離職: 8 },
  { month: "2月", 入職: 20, 離職: 5 },
  { month: "3月", 入職: 18, 離職: 10 },
  { month: "4月", 入職: 25, 離職: 7 },
  { month: "5月", 入職: 22, 離職: 9 },
  { month: "6月", 入職: 23, 離職: 8 },
];

const recentActivities = [
  { action: "新員工入職", detail: "張小明 加入技術部", time: "2 小時前" },
  { action: "請假申請", detail: "李文華 申請年假 3 天", time: "3 小時前" },
  { action: "績效評估", detail: "Q2 績效評估已完成 85%", time: "5 小時前" },
  { action: "培訓通知", detail: "新員工培訓將於下週一開始", time: "1 天前" },
  { action: "薪資發放", detail: "6月份薪資已發放完成", time: "2 天前" },
];

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">儀表板</h1>
        <p className="page-description">人力資源管理系統總覽</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              {stat.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-warning" />
              )}
              <span className={stat.trend === "up" ? "text-success" : "text-warning"}>
                {stat.change}
              </span>
              <span className="text-muted-foreground">較上月</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">入離職趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <Tooltip />
                <Line type="monotone" dataKey="入職" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="離職" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">性別比例</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">各部門人數</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">最近動態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
