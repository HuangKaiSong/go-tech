import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@go-tech-frontend/ui';
import { Bell, Briefcase, Home, LogOut, MessageCircle, Package, Search, Settings, Sparkles, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from '@/app/components/Link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from '@/i18n/navigation';
import { useProgressRouter } from '../hooks/use-progress-router';
import { DynamicText } from './DynamicI18nText';

const quickNav = [
  ['/', Home, '首頁'],
  ['/core-advantages', Sparkles, '核心優勢'],
  ['/service-plan', Briefcase, '服務計劃'],
  ['/contact', MessageCircle, '聯絡我們']
] as const;

const pages = [
  ['/', '首頁'],
  ['/core-advantages', '核心優勢'],
  ['/system-features', '查看系統功能'],
  ['/service-plan', '服務計劃'],
  ['/target-audience', '理想客戶'],
  ['/contact', '聯繫我們'],
  ['/feedback', '需求反饋']
] as const;
const notices = [
  ['14 天免費試用', '立即體驗 GO-TECHS 租務及 HR 系統'],
  ['新功能上線', 'HR 系統新增發展與績效模塊'],
  ['年費優惠', '選擇 12 個月方案即享 8 折']
];

const MobileNav = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useProgressRouter();
  // const { isLoggedIn, logout, user } = useAuth();
  const { logout, user } = useAuth();
  const isLoggedIn = false;

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [q, setQ] = useState('');

  const handleLogout = async () => {
    setIsSheetOpen(false);
    logout();
  };

  return (
    <nav
      aria-label="手機導航"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t shadow-[0_-2px_10px_hsl(var(--foreground)/0.08)] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
    >
      {!isLoggedIn ? (
        <>
          {quickNav.map(([href, Icon, label]) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                <DynamicText text={label} />
              </Link>
            );
          })}
        </>
      ) : (
        <>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground active:text-primary"
          >
            <Search className="w-5 h-5" />
            <DynamicText text="搜尋" />
          </button>
          <button
            onClick={() => setNotifyOpen(true)}
            className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground active:text-primary"
          >
            <Bell className="w-5 h-5" />
            <DynamicText text="通知" />
            <span className="absolute top-1.5 left-1/2 ml-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>
          <Link
            href="/feedback"
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${pathname === '/feedback' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <DynamicText text="支援" />
          </Link>
          <button
            onClick={() => (isLoggedIn ? setIsSheetOpen(true) : router.push('/login'))}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground active:text-primary"
          >
            <User className="w-5 h-5" />
            <DynamicText text="賬戶" />
          </button>
        </>
      )}

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="bg-background">
          <SheetHeader>
            <SheetTitle>
              <DynamicText text="搜尋" />
            </SheetTitle>
          </SheetHeader>
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜尋頁面，例如：服務計劃"
            className="mt-4 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
          <div className="mt-3 space-y-1">
            {pages
              .filter(([, l]) => l.includes(q.trim()))
              .map(([to, l]) => (
                <Link
                  key={to}
                  href={to}
                  onClick={() => setSearchOpen(false)}
                  className="block p-2.5 rounded-md text-sm hover:bg-muted"
                >
                  {l}
                </Link>
              ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={notifyOpen} onOpenChange={setNotifyOpen}>
        <SheetContent side="right" className="w-80 bg-background">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>通知</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {notices.map(([n, d]) => (
              <div key={n} className="p-3 rounded-lg border">
                <p className="text-sm font-semibold">{n}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-80 bg-background" aria-describedby={undefined}>
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{user?.nickname}</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            <Link
              href="/my-orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsSheetOpen(false)}
            >
              <Package className="w-5 h-5 text-muted-foreground" />
              <span>{t('Nav.myOrders')}</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsSheetOpen(false)}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span>{t('Common.setting')}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('Common.logout')}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
