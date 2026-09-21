'use client';

// import Logo from "@/assets/Gotech_Logo.webp";
import {
  Briefcase,
  Crown,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Settings,
  Sparkles,
  User,
  Users
} from 'lucide-react';
import Link from '@/app/components/Link';

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@go-tech-frontend/ui';
import { toast } from '@go-tech/web-ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { filterTenantsByBizCode, startFreeTrial } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { useTrialWindow } from '@/contexts/TrialWindowContext';
import { DynamicText } from '../DynamicI18nText';

const Header = () => {
  const t = useTranslations();
  const router = useProgressRouter();
  const { product } = useProductSelection();
  const { openPmsCallback: generateCallback } = useTrialWindow();
  const { isLoggedIn, logout, refetchTenants, tenants, tenantsStatus, token, user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const productTenants = filterTenantsByBizCode(tenants, product);
  const hasTenant = productTenants.length > 0;

  useEffect(() => {
    // SSR 返回空数组时缓存保持 idle；先确认租户结果，再开放当前产品的免费试用入口。
    if (token && tenantsStatus === 'idle') refetchTenants(token);
  }, [refetchTenants, tenantsStatus, token]);

  const handleLogout = async () => {
    setIsSheetOpen(false);
    logout();
  };

  return (
    <div className="h-25 min-w-[1280px] backdrop-blur-xl bg-foreground/80 text-white/70 overflow-hidden relative select-none">
      <div className="bg-foreground/80 backdrop-blur-sm py-2">
        <div className="container mx-auto px-4 flex items-center justify-center md:justify-end gap-6 text-sm">
          <div className="flex items-center gap-2 text-white/90">
            <Phone className="w-4 h-4" />
            <span>+852 5971 1918</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/90">
            <Mail className="w-4 h-4" />
            <span>info@go-tech.com</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90">
            <MapPin className="w-4 h-4" />
            <span>香港九龍觀塘道123號</span>
          </div>
        </div>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-white">GO-TECH</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/core-advantages"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
              {t('Nav.coreAdvantages')}
            </Link>
            <span className="text-white/30 select-none">|</span>
            <Link
              href="/system-features"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={2} />
              {t('Nav.systemFeatures')}
            </Link>
            <span className="text-white/30 select-none">|</span>
            <Link
              href="/service-plan"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <Briefcase className="w-4 h-4 shrink-0" strokeWidth={2} />
              {t('Nav.servicePlan')}
            </Link>
            <span className="text-white/30 select-none">|</span>
            <Link
              href="/target-audience"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <Users className="w-4 h-4 shrink-0" strokeWidth={2} />
              {t('Nav.targetAudience')}
            </Link>
            <span className="text-white/30 select-none">|</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
              {t('Nav.contact')}
            </Link>
            <span className="text-white/30 select-none">|</span>
            <Link
              href="/feedback"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-primary hover:bg-white/5 transition-colors leading-none"
            >
              <Lightbulb className="w-4 h-4 shrink-0" strokeWidth={2} />
              <DynamicText text="需求反饋" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  size="sm"
                  variant="trial"
                  className="px-4"
                  onClick={() => {
                    hasTenant
                      ? router.push('/select-account')
                      : startFreeTrial({
                          generateCallback,
                          bizCode: product,
                          onHrTrialHostMissing: () => toast.error(t('Account.hrTrialHostMissing')),
                          onTrialExpired: () => router.push('/service-plan'),
                          token
                        });
                  }}
                >
                  {hasTenant ? <DynamicText text="選擇系統" /> : <DynamicText text="立即試用" />}
                </Button>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-2 text-white hover:text-primary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{user?.nickname}</span>
                      <Crown className="w-4 h-4 text-yellow-400" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-background">
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
              </>
            ) : (
              <>
                <Link href="/account/register">
                  <Button variant="trial" size="sm" className="px-4">
                    {t('Nav.freeTrial')}
                  </Button>
                </Link>
                <Link href="/account/login">
                  <Button size="sm">{t('Common.login')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
