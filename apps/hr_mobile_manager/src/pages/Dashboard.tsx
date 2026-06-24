import {
  BarChart3,
  Bell,
  BookUser,
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  MapPin,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';

const quickActions = [
  { icon: Clock, label: '打卡', path: '/clock', color: 'bg-primary' },
  { icon: FileText, label: '請假', path: '/applications', color: 'bg-accent' },
  { icon: DollarSign, label: '薪酬', path: '/salary', color: 'bg-warning' },
  { icon: BarChart3, label: 'KPI', path: '/kpi', color: 'bg-info' },
  { icon: GraduationCap, label: '培訓', path: '/training', color: 'bg-[hsl(var(--info))]' },
  { icon: BookUser, label: '通訊錄', path: '/contacts', color: 'bg-accent' },
  { icon: User, label: '個人資料', path: '/profile', color: 'bg-success' },
  { icon: Bell, label: '通知', path: '/notifications', color: 'bg-destructive' }
];

const getGreeting = (hour: number) => {
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const now = new Date();
  const greeting = getGreeting(now.getHours());

  return (
    <MobileLayout>
      {/* Top header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 dark:from-[hsl(220,25%,14%)] dark:to-[hsl(220,20%,18%)] px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">{greeting}，</p>
            <h2 className="text-xl font-bold text-primary-foreground">王小明</h2>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <User className="w-6.5 h-6.5 text-primary-foreground" />
          </button>
        </div>

        {/* Today status card */}
        <div className="bg-primary-foreground/10 dark:bg-[hsl(220,20%,20%)]/60 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <span className="text-sm">
                {now.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-[18px] h-[18px]" />
              <span>台北總部</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">上班打卡</p>
              <p className="text-lg font-semibold text-primary-foreground">09:02</p>
            </div>
            <div className="w-px h-8 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">下班打卡</p>
              <p className="text-lg font-semibold text-primary-foreground">--:--</p>
            </div>
            <div className="w-px h-8 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-xs text-primary-foreground/60">工時</p>
              <p className="text-lg font-semibold text-primary-foreground">進行中</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${action.color} dark:opacity-80 flex items-center justify-center`}
                >
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
          <button className="flex items-center text-xs text-primary">
            查看全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            {
              title: '年假申請待審批',
              subtitle: '李小華 · 3/12-3/14',
              tag: '待審批',
              tagColor: 'bg-warning/10 text-warning'
            },
            {
              title: '加班申請待確認',
              subtitle: '張大偉 · 3/10 18:00-21:00',
              tag: '待確認',
              tagColor: 'bg-info/10 text-info'
            },
            {
              title: '三月份薪資已發布',
              subtitle: '點擊查看詳細薪資明細',
              tag: '新通知',
              tagColor: 'bg-success/10 text-success'
            }
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${item.tagColor}`}>
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
