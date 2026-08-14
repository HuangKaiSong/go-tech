'use client';

// import Logo from "@/assets/Gotech_Logo.webp";
import { Crown, LogOut, Mail, Package, Phone, Settings, User } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import Link from '@/app/components/Link';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@go-tech-frontend/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { goNow, startFreeTrial } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useIframeContext } from '@/contexts/IframeContext';
import { useTrialWindow } from '@/contexts/TrialWindowContext';
import { DynamicText } from './DynamicI18nText';
import LocaleSwitcher from './LocaleSwitcher';
import { type PageBlock } from './PageBlocks';

const SelectTenant = ({ generateCallback }: { generateCallback: (uri: string) => void }) => {
  const router = useProgressRouter();
  const t = useTranslations();
  const { hasIframe } = useIframeContext();
  const { isLoggedIn, tenants, token } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleClick = async (tenant: Tenant) => {
    const response = await fetch(`/go-tech/platform/platformCustomer/gotoPmsCode?tenantId=${tenant!.tenantId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-type': 'platform_customer'
      }
    }).then(res => res.json());
    if (response.code === 200) {
      const uri = `tenantCallback?code=${response.data}`;
      generateCallback(uri);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        className="h-9 w-32 text-xs flex items-center justify-center cursor-pointer text-foreground"
        onClick={() => {
          if (hasIframe) {
            return false;
          }
          if (!isLoggedIn) {
            router.push('/account/login');
          }
          router.push('/select-account?from=header');
          // setIsOpen(true);
        }}
      >
        {t('Nav.gotoPms')}
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center justify-center gap-2">{t('Nav.selectTenant')}</DialogTitle>
          </DialogHeader>
          {/* 选择租户 */}
          <div className="grid grid-cols-3 gap-4 items-center justify-center">
            {Array.isArray(tenants) &&
              tenants.map(tenant => (
                <div
                  key={tenant.tenantId}
                  onClick={() => handleClick(tenant)}
                  className="flex flex-col items-center rounded-lg border-solid border border-transparent py-2 gap-y-2 transition-all hover:border-primary active:hover:border-primary"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl">{tenant.tenantName?.slice(0, 1)}</span>
                  </div>
                  <p className="text-sm font-medium">{tenant.tenantName}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Header = ({ heroBg, initialBlocks }: { heroBg?: string | StaticImageData; initialBlocks?: PageBlock[] }) => {
  const t = useTranslations();
  const router = useProgressRouter();
  const { hasIframe } = useIframeContext();
  const { openPmsCallback: generateCallback } = useTrialWindow();
  const { isLoggedIn, logout, tenants, token, user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const defaultLogoSrc = '/images/Gotech_Logo.webp';
  const block = initialBlocks?.find(bloc => bloc.type === 'common');
  const {
    emailValue = 'info@go-techs.com',
    logo = defaultLogoSrc,
    phoneValue = '+852 5971 1918'
  } = block?.values || {};

  const hasTenant = tenants && tenants.length > 0;

  const handleLogout = async () => {
    setIsSheetOpen(false);
    logout();
  };

  return (
    <div className="h-44 min-w-[1280px] backdrop-blur-xl bg-black/70 text-white/70 overflow-hidden relative select-none">
      {heroBg && (
        <Image
          src={heroBg}
          alt="logo"
          fill
          loading="eager"
          className="w-full h-150 absolute inset-0 -z-10 object-cover"
        />
      )}
      <div className="w-full h-full backdrop-blur-xl">
        <div className="mx-auto flex h-full w-[1280px] min-w-[1280px] max-w-[1280px] flex-row items-center gap-10">
          {/* logo */}
          <Link href="/" className="shrink-0">
            {/* oxlint-disable next/no-img-element */}
            <img
              src={logo}
              alt="logo"
              data-block-id="common-info"
              data-block-role="logo"
              className={`w-40 ${hasIframe ? 'cursor-editor' : ''}`}
            />
          </Link>
          {/* menu */}
          <div className="flex-1 min-w-0 flex flex-col h-full py-4 justify-between">
            <div />
            <nav className="hidden md:flex items-center justify-between gap-4 whitespace-nowrap">
              <Link href="/core-advantages" className="text-lg hover:text-primary transition-colors col-span-1">
                {t('Nav.coreAdvantages')}
              </Link>
              <div className="h-10 border border-white/70" />
              <Link href="/system-features" className="text-lg hover:text-primary transition-colors col-span-1">
                {t('Nav.systemFeatures')}
              </Link>
              <div className="h-10 border border-white/70" />
              <Link href="/service-plan" className="text-lg hover:text-primary transition-colors col-span-1">
                {t('Nav.servicePlan')}
              </Link>
              <div className="h-10 border border-white/70" />
              <Link href="/target-audience" className="text-lg hover:text-primary transition-colors col-span-1">
                {t('Nav.targetAudience')}
              </Link>
              <div className="h-10 border border-white/70" />
              <Link href="/contact" className="text-lg hover:text-primary transition-colors col-span-1">
                {t('Nav.contact')}
              </Link>
              <div className="h-10 border border-white/70" />
              <Link href="/feedback" className="text-lg hover:text-primary transition-colors col-span-1">
                <DynamicText text="需求反饋" />
              </Link>
            </nav>
            <div className="grid grid-cols-2 text-sm text-white/80">
              <div
                data-block-id="common-info"
                data-block-role="phone"
                className={`flex items-center justify-center gap-2 ${hasIframe ? 'cursor-editor' : ''}`}
              >
                <Phone className="w-12 h-12" />
                <div className="flex flex-col">
                  <div data-block-id="common-info" data-block-role="phoneTitle">
                    {t('Nav.callUs')}
                  </div>
                  <div data-block-id="common-info" data-block-role="phoneValue" className="select-all">
                    {phoneValue}
                  </div>
                </div>
              </div>
              <div
                data-block-id="common-info"
                data-block-role="email"
                className={`flex items-center justify-center gap-2 ${hasIframe ? 'cursor-editor' : ''}`}
              >
                <Mail className="w-12 h-12" />
                <div className="flex flex-col">
                  <div data-block-id="common-info" data-block-role="emailTitle">
                    {t('Nav.mailToUs')}
                  </div>
                  <div data-block-id="common-info" data-block-role="emailValue" className="select-all">
                    {emailValue}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* operate */}
          <div className="basis-50 shrink-0 flex flex-col h-full py-4 justify-between">
            <div />
            <div className="flex flex-row justify-between gap-3 items-center">
              {isLoggedIn && user ? (
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{user.nickname}</span>
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
                          <p className="font-semibold">{user.nickname}</p>
                          <p className="text-sm text-muted-foreground">{user.sub}</p>
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
              ) : (
                <Link href="/account/login">
                  <Button className="px-10" size="sm">
                    {t('Common.login')}
                  </Button>
                </Link>
              )}
              <LocaleSwitcher />
            </div>
            <div className="flex flex-row bg-background items-center rounded-l-sm rounded-r-lg justify-end">
              {hasTenant ? (
                <>
                  <SelectTenant generateCallback={generateCallback} />
                  <Button
                    size="sm"
                    disabled={!isLoggedIn}
                    className="shadow-primary shadow-2xl"
                    onClick={() => goNow({ generateCallback, tenants, token })}
                  >
                    {t('Nav.goNow')}
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="h-9 w-32 text-xs flex items-center justify-center cursor-pointer text-foreground"
                    onClick={() => {
                      if (hasIframe) {
                        return false;
                      }
                      if (!isLoggedIn) {
                        router.push('/account/login');
                      }
                    }}
                  >
                    {t('Nav.clickToTrial')}
                  </div>
                  <Button
                    size="sm"
                    disabled={!isLoggedIn}
                    className="shadow-primary shadow-2xl"
                    onClick={() => startFreeTrial({ generateCallback, token })}
                  >
                    {t('Nav.freeTrial')}
                  </Button>
                </>
              )}
              <div />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
