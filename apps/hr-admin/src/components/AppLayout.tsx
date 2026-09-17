import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { ServiceExpiryBanner } from '@/components/ServiceExpiryBanner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { clearToken, getUser } from '@/lib/auth';
import { isRouteAllowed } from '@/lib/menuRoutes';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/** 无权限占位：路径归属的菜单不在当前职位授权范围内时展示 */
function Forbidden() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-1">{t('無權訪問此頁面')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('您的職位未被授權存取該功能，如需開通請聯繫 HR 或管理員。')}
      </p>
      <Button asChild variant="outline">
        <Link to="/">{t('返回儀表板')}</Link>
      </Button>
    </div>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const allowed = isRouteAllowed(location.pathname);
  const { t } = useTranslation();
  const user = getUser();
  // 全站头像统一用名字首字（系统无头像上传，与聊天/通讯录一致）
  const initial = (user?.userName || '').trim().charAt(0) || '?';

  const handleLogout = () => {
    clearToken();
    toast.success(t('已退出登入'));
    navigate('/login', { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ServiceExpiryBanner />
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate">{user?.userName || t('我的帳號')}</span>
                    {user?.employeeNo && (
                      <span className="text-xs font-normal text-muted-foreground">{user.employeeNo}</span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('退出登入')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">{allowed ? <Outlet /> : <Forbidden />}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
