'use client';

import { Badge as CustomBadge } from '@go-tech-frontend/ui';
import { Button, toast } from '@go-tech/web-ui';
import { Badge } from 'antd';
import dayjs from 'dayjs';
import { ArrowRight, Building, Calendar, CheckCircle2, Clock, Package, ShieldCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import servicePlanBg from '@/assets/service-plan-bg.jpg';
import { useAuth } from '@/contexts/AuthContext';
import ThemeSchemaToggler from '../components/ThemeSchemaToggler';
import { accountGridGradient } from './account-grid-theme';

const resolveAction = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('service-plan')) return 'service-plan';
  if (normalized.includes('trial-env')) return 'trial-env';
  if (normalized.includes('order')) return 'order';

  return null;
};

const SelectAccount = () => {
  const t = useTranslations('Account');
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const fromHeader = from && from === 'header';
  const { refetchTenants, tenants, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useProgressRouter();

  const accountGridBackground = resolvedTheme === 'dark' ? accountGridGradient.dark : accountGridGradient.light;
  const pm2Window = useRef<Window | null>(null);

  function cleanup() {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('pm2Window', handleCustomEvent as EventListener);
  }

  // 跳转续费
  const toRenew = (tenant: Tenant) => {
    if (tenant && tenant.orderId) {
      router.push(`/renew-order/${tenant.orderId}`);
      return;
    }

    toast.error(t('noOrderId'));
  };

  const generateCallback = (uri: string) => {
    const taialHost = process.env.NEXT_PUBLIC_TRIAL_HOST;

    pm2Window.current = window.open(`${taialHost}/oauth/${uri}`, '_blank');
  };

  const handleEnter = async (tenant: Tenant) => {
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
    }
  };

  const handleClick = (tenant: Tenant) => {
    const isActive = dayjs(tenant.expireDate).isAfter(dayjs());
    if (isActive) {
      handleEnter(tenant);
      return;
    }

    toRenew(tenant);
  };

  const tryOut = async () => {
    const response = await fetch('/go-tech/platform/platformCustomer/trialCode', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-type': 'platform_customer'
      }
    });
    if (response.ok) {
      const result = await response.json();
      if (result.code === 200) {
        const uri = `tryCallback?code=${result.data}`;
        generateCallback(uri);
      }
    }
  };

  function applyAction(action: 'order' | 'service-plan' | 'trial-env') {
    if (action === 'trial-env') {
      tryOut();
      return;
    }
    if (action === 'service-plan') {
      pm2Window.current = window.open(`/service-plan`, '_blank');
      router.replace('/service-plan');
      return;
    }
    if (action === 'order') {
      pm2Window.current = window.open(`/my-orders`, '_blank');
      router.replace('/my-orders');
      return;
    }
    if (pm2Window.current) {
      pm2Window.current?.close();
    }
    cleanup();
    window.focus();
  }

  function handleMessage(event: MessageEvent) {
    const action = resolveAction(event.data?.command ?? event.data?.action ?? event.data?.type);
    if (!action) return;
    applyAction(action);
  }

  function handleCustomEvent(event: Event) {
    const detail = (event as CustomEvent).detail;
    const action = resolveAction(detail?.command ?? detail?.action ?? detail?.type);
    if (!action) return;
    applyAction(action);
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    window.addEventListener('pm2Window', handleCustomEvent as EventListener);
    if (token) {
      refetchTenants(token);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('pm2Window', handleCustomEvent as EventListener);
    };
    // oxlint-disable react-hook/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section
        className="relative pt-12 pb-12 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg.src})` }}
      >
        <div className="container mx-auto px-4 text-center">
          {!fromHeader && (
            <CustomBadge className="mb-3 bg-card/80 text-primary border border-primary/30 hover:bg-card">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {t('signInSuccess')}
            </CustomBadge>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{t('selectAccountTitle')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t('selectAccountDesc')}</p>
        </div>
      </section>

      {/* Account grid */}
      <section className="flex-1 py-12" style={{ backgroundImage: accountGridBackground }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(acc => {
              const isActive = dayjs(acc.expireDate).isAfter(dayjs());
              const statusLabel = isActive ? t('inUse') : t('expired');

              return (
                <Badge.Ribbon
                  classNames={{ indicator: 'top-4!' }}
                  color={isActive ? '#5ee5b5' : '#737b8c'}
                  text={
                    <div className="flex items-center text-sm px-2.5 py-0.5">
                      {isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {statusLabel}
                    </div>
                  }
                >
                  <button
                    key={acc.tenantId}
                    onClick={() => handleClick(acc)}
                    className={`group w-full h-full text-left bg-card rounded-2xl border-2 p-6 flex flex-col transition-all border-border hover:border-primary hover:shadow-[0_12px_30px_-12px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5 ${
                      isActive ? '' : 'bg-card/90'
                    }`}
                  >
                    {/* Top: tier + status */}
                    <div className="flex items-start justify-between mb-4">
                      {/* <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 font-bold text-lg ${tierBadgeClass[acc.planTier]}`}
                      >
                        {acc.planTier}
                      </div> */}
                      <div>
                        {/* Company */}
                        <h3 className="text-lg font-bold text-foreground leading-snug mb-1">{acc.company}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="text-foreground font-medium">{acc.tenantName}</span>
                          <span>·</span>
                          <span>{t('maxUnits', { count: acc.unitCount })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta rows */}
                    <div className="space-y-2 py-3 border-y border-border/60 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" /> {t('memberCount')}
                        </span>
                        <span className="text-foreground font-medium">
                          {t('peopleValue', { count: acc.userCount })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" /> {t('validUntil')}
                        </span>
                        <span className="text-foreground font-medium">{acc.expireDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Building className="w-4 h-4" /> {t('myRole')}
                        </span>
                        <span className="text-foreground font-medium">{acc.myRole}</span>
                      </div>
                    </div>

                    {/* Addons */}
                    {acc.additional && (
                      <div className="mb-5">
                        <div className="text-xs text-muted-foreground mb-2">{t('enabledAddons')}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {acc.additional.split(',').map((a: any) => (
                            <span key={a} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto">
                      <div
                        className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                          isActive
                            ? 'bg-primary/5 group-hover:bg-primary group-hover:text-primary-foreground text-primary'
                            : 'bg-[#FFF1E8] text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        }`}
                      >
                        <span className="text-sm font-semibold">{isActive ? t('enterAccount') : t('renewNow')}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                </Badge.Ribbon>
              );
            })}

            {/* Add new package card */}
            <button
              onClick={() => router.push('/service-plan')}
              className="text-left bg-card/60 rounded-2xl border-2 border-dashed border-primary/40 p-6 flex flex-col items-center justify-center min-h-[280px] hover:bg-card hover:border-primary transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div className="text-base font-bold text-foreground mb-1">{t('buyNewPlan')}</div>
              <div className="text-xs text-muted-foreground text-center">{t('buyNewPlanDesc')}</div>
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-10 pt-6 border-t border-border/60">
            <p className="text-sm text-muted-foreground">{t('ordersHint')}</p>
            <div className="flex gap-3">
              <ThemeSchemaToggler />
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
                onClick={() => router.push('/my-orders')}
              >
                {t('viewMyOrders')}
              </Button>
              <Button onClick={() => router.push('/')}>{t('backHome')}</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SelectAccount;
