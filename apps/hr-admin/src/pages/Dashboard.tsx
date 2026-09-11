import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Package,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { type DashboardOverview, getDashboardOverview, type NameValue } from '@/api/dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasRoute } from '@/lib/auth';

/** 需求溝通階段先用模擬數據呈現頁面。後端 dashboard/overview 就緒後，把 USE_MOCK 改為 false 即切換為真實數據（queryFn 已寫好），並可刪除下方 MOCK_OVERVIEW。 */
const USE_MOCK = true;
const MOCK_OVERVIEW: DashboardOverview = {
  kpi: {
    totalEmployees: 1284,
    totalEmployeesDelta: 12,
    hiresThisMonth: 23,
    hiresDelta: 5,
    leavesThisMonth: 8,
    leavesDelta: -2,
    attendanceRate: 96.5,
    attendanceRateDelta: 0.3
  },
  todos: {
    myApprovals: 7,
    approvalBreakdown: '請假 4 · 加班 2 · 報銷 1',
    onboarding: 3,
    offboarding: 2,
    perfCalibration: 5,
    trainingDraft: 1
  },
  statusDist: [
    { name: '在職', value: 1180 },
    { name: '休假中', value: 46 },
    { name: '待離職', value: 12 },
    { name: '離職', value: 46 }
  ],
  deptHeadcount: [
    { name: '技術部', value: 320 },
    { name: '銷售部', value: 240 },
    { name: '運營部', value: 200 },
    { name: '市場部', value: 180 },
    { name: '客服部', value: 144 },
    { name: '財務部', value: 120 },
    { name: '人事部', value: 80 }
  ],
  genderRatio: [
    { name: '男性', value: 720 },
    { name: '女性', value: 564 }
  ],
  hireLeaveTrend: [
    { month: '3月', hires: 18, leaves: 10 },
    { month: '4月', hires: 25, leaves: 7 },
    { month: '5月', hires: 22, leaves: 9 },
    { month: '6月', hires: 23, leaves: 8 },
    { month: '7月', hires: 19, leaves: 6 },
    { month: '8月', hires: 23, leaves: 8 }
  ],
  gradeDist: [
    { name: 'A', value: 42 },
    { name: 'B', value: 78 },
    { name: 'C', value: 21 },
    { name: 'D', value: 6 }
  ],
  payroll: {
    period: '2026 年 8 月',
    steps: [
      { name: '部門主管', done: true, current: false },
      { name: 'HR 經理', done: true, current: false },
      { name: '財務', done: false, current: true },
      { name: '總經理', done: false, current: false }
    ],
    statusText: '審批中 · 待財務',
    grossTotal: 'HK$ 8,642,000',
    laborCost: 'HK$ 9,180,000',
    anomalies: 2
  },
  unreadCount: 6,
  activities: [
    { type: 'onboarding', title: '新員工入職', detail: '張小明 加入技術部', time: '2 小時前' },
    { type: 'leave', title: '請假申請', detail: '李文華 申請年假 3 天，待審批', time: '3 小時前' },
    { type: 'performance', title: '績效評估', detail: 'Q2 評估完成率達 85%', time: '5 小時前' },
    { type: 'training', title: '培訓通知', detail: '新員工培訓將於下週一開始', time: '1 天前' },
    { type: 'payroll', title: '薪資發放', detail: '7 月薪資已發放完成', time: '2 天前' }
  ]
};

const STATUS_COLORS = ['hsl(215,70%,45%)', 'hsl(160,70%,38%)', 'hsl(38,92%,45%)', 'hsl(215,15%,60%)'];
const GENDER_COLORS = ['hsl(215,70%,45%)', 'hsl(200,75%,55%)'];
const GRADE_COLORS: Record<string, string> = {
  A: 'hsl(160,70%,38%)',
  B: 'hsl(215,70%,45%)',
  C: 'hsl(38,92%,45%)',
  D: 'hsl(0,72%,55%)'
};
const AXIS_TICK = { fill: 'hsl(215, 15%, 50%)', fontSize: 12 };
// 靜態類名映射（Tailwind 無法從動態字符串生成類，必須寫全）
const TONE: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent-foreground',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive'
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isError, isLoading } = useQuery({
    queryKey: ['dashboardOverview', USE_MOCK],
    queryFn: () => (USE_MOCK ? Promise.resolve(MOCK_OVERVIEW) : getDashboardOverview().then(r => r.data))
  });

  // 卡片級門控（未提供路由集合時放行全部）
  const canEmp = hasRoute('/employees');
  const canApproval = hasRoute('/attendance/approval');
  const canPerf = hasRoute('/performance');
  const canTraining = hasRoute('/training');
  const canPayroll = hasRoute('/payroll');

  if (isError) {
    return <div className="py-24 text-center text-muted-foreground">{t('載入失敗')}</div>;
  }
  if (isLoading || !data) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
        {t('載入中...')}
      </div>
    );
  }

  const {
    activities,
    deptHeadcount,
    genderRatio,
    gradeDist,
    hireLeaveTrend,
    kpi,
    payroll,
    statusDist,
    todos,
    unreadCount
  } = data;

  const kpiCards = [
    {
      key: 'total',
      label: t('總員工數'),
      value: kpi.totalEmployees.toLocaleString(),
      delta: kpi.totalEmployeesDelta,
      icon: Users,
      color: 'text-primary',
      show: true
    },
    {
      key: 'hires',
      label: t('本月新入職'),
      value: String(kpi.hiresThisMonth),
      delta: kpi.hiresDelta,
      icon: UserPlus,
      color: 'text-accent-foreground',
      show: canEmp
    },
    {
      key: 'leaves',
      label: t('本月離職'),
      value: String(kpi.leavesThisMonth),
      delta: kpi.leavesDelta,
      icon: UserCheck,
      color: 'text-warning',
      show: canEmp
    },
    {
      key: 'att',
      label: t('本月出勤率'),
      value: `${kpi.attendanceRate}%`,
      delta: kpi.attendanceRateDelta,
      deltaSuffix: '%',
      icon: Clock,
      color: 'text-success',
      show: true
    }
  ].filter(c => c.show);

  const todoItems = [
    {
      key: 'approval',
      show: canApproval,
      icon: FileText,
      tone: 'primary',
      label: t('待我審批'),
      desc: todos.approvalBreakdown,
      count: todos.myApprovals,
      to: '/attendance/approval'
    },
    {
      key: 'onboarding',
      show: canEmp,
      icon: Target,
      tone: 'accent',
      label: t('入職待辦'),
      desc: t('{{n}} 張入職單進行中', { n: todos.onboarding }),
      count: todos.onboarding,
      to: '/employees/onboarding'
    },
    {
      key: 'offboarding',
      show: canEmp,
      icon: Package,
      tone: 'warning',
      label: t('離職待辦'),
      desc: t('{{n}} 張離職交接中', { n: todos.offboarding }),
      count: todos.offboarding,
      to: '/employees/offboarding'
    },
    {
      key: 'perf',
      show: canPerf,
      icon: Award,
      tone: 'success',
      label: t('績效待校准'),
      desc: t('{{n}} 筆三方評分已齊', { n: todos.perfCalibration }),
      count: todos.perfCalibration,
      to: '/performance/evaluation'
    },
    {
      key: 'training',
      show: canTraining,
      icon: BookOpen,
      tone: 'destructive',
      label: t('培訓待發佈'),
      desc: t('{{n}} 個計劃草稿待發', { n: todos.trainingDraft }),
      count: todos.trainingDraft,
      to: '/training/plans'
    }
  ].filter(it => it.show);

  const showStatus = canEmp && statusDist.length > 0;
  const showDept = canEmp && deptHeadcount.length > 0;
  const showGender = canEmp && genderRatio.length > 0;
  const showTrend = canEmp && hireLeaveTrend.length > 0;
  const showGrade = canPerf && gradeDist.length > 0;
  const showPayroll = canPayroll && payroll !== null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('儀表板')}</h1>
        <p className="page-description">{t('人力資源管理系統總覽')}</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(c => {
          const up = c.delta >= 0;
          return (
            <div key={c.key} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-muted ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {up ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={up ? 'text-success' : 'text-destructive'}>
                  {up ? '+' : ''}
                  {c.delta}
                  {c.deltaSuffix || ''}
                </span>
                <span className="text-muted-foreground">{t('較上月')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 待办中心 + 员工状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {todoItems.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                {t('待辦中心')}
                <span className="text-xs font-normal text-muted-foreground">{t('點擊直達對應頁面')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todoItems.map(it => (
                  <button
                    key={it.key}
                    onClick={() => navigate(it.to)}
                    className="flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${TONE[it.tone]}`}>
                      <it.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{it.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{it.desc}</p>
                    </div>
                    <Badge variant="secondary" className={TONE[it.tone]}>
                      {it.count}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{t('員工狀態分布')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, t(n)]} />
                  <Legend formatter={(v: string) => t(v)} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 部门人数 + 未读通知/动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {showDept && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{t('各部門人數')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptHeadcount}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} />
                  <Tooltip />
                  <Bar dataKey="value" name={t('人數')} fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('未讀通知')}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('暫無動態')}</p>
              )}
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t(a.title)}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 趋势 + 性别 + 绩效等级 */}
      {(showTrend || showGender || showGrade) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {showTrend && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('入離職趨勢')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={hireLeaveTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="hires"
                      name={t('入職')}
                      stroke="hsl(215,70%,45%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leaves"
                      name={t('離職')}
                      stroke="hsl(38,92%,50%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showGender && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('性別比例')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={genderRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {genderRatio.map((_, i) => (
                        <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [v, t(n)]} />
                    <Legend formatter={(v: string) => t(v)} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showGrade && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('績效等級分布')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={gradeDist}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip />
                    <Bar dataKey="value" name={t('人數')} radius={[4, 4, 0, 0]}>
                      {gradeDist.map((g: NameValue, i) => (
                        <Cell key={i} fill={GRADE_COLORS[g.name] || 'hsl(215,70%,45%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 薪资批次 */}
      {showPayroll && payroll && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              {t('本月薪資批次')}
              <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                {t(payroll.statusText)}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{payroll.period}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {payroll.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      s.done
                        ? 'bg-success/10 text-success'
                        : s.current
                          ? 'bg-primary/10 text-primary ring-2 ring-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${s.current ? 'font-semibold' : ''}`}>{t(s.name)}</span>
                  {i < payroll.steps.length - 1 && <span className="text-border mx-1">———</span>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: t('應發總額'), value: payroll.grossTotal },
                { label: t('本月人力成本'), value: payroll.laborCost },
                { label: t('異常待說明'), value: t('{{n}} 筆', { n: payroll.anomalies }) }
              ].map((x, i) => (
                <div key={i} className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{x.label}</p>
                  <p className="text-lg font-bold mt-1">{x.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
