'use client';

import { Button } from '@go-tech-frontend/ui';
import { useSessionStorageState } from 'ahooks';
import { Check, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import valueAddedServices from '@/app/constants/addedServices';
import servicePlanBg from '@/assets/service-plan-bg.jpg';

const getIconHref = (value: string) => {
  const normalized = value
    .trim()
    .replace(/^#/, '')
    .replace(/^icon-/, '');
  return `#icon-${normalized}`;
};

const SelectPlan = ({ plan }: { plan: Packages }) => {
  const router = useRouter();
  const [needAddons, setNeedAddons] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedServices, setSelectedServices] = useSessionStorageState<Record<string, number>>(
    'user-selected-services',
    {
      defaultValue: {},
      listenStorageChange: true
    }
  );
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const selectedServicesSafe = hasMounted ? (selectedServices ?? {}) : {};

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev && prev[serviceId] !== undefined) {
        const newState = { ...prev };
        delete newState[serviceId];
        return newState;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev![serviceId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [serviceId]: newValue };
    });
  };

  const handleGoBack = () => {
    router.push('/service-plan');
  };

  const handleNext = () => {
    router.push(`/confirm-order/${plan.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-cover bg-center" style={{ backgroundImage: `url(${servicePlanBg})` }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">選擇套餐</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-1 bg-linear-to-b from-[#FFF8F5] via-[#FFF5F0] to-[#FFEEE5]">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-700">{plan.packageName}</h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">${plan.price.toLocaleString()}</span>
                <span className="text-lg text-primary ml-1">HKD</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">套餐内容</span>
                <span className="text-sm text-gray-700">最多可創建{plan.unitCount}個單位</span>
              </div>

              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">包含功能</span>
                <div className="flex flex-wrap gap-2">
                  {plan.packageItemList.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground"
                      style={{ backgroundColor: '#FAEEEB' }}
                    >
                      {feature.menuIcon && (
                        <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                          <use href={getIconHref(feature.menuIcon)} xlinkHref={getIconHref(feature.menuIcon)} />
                        </svg>
                      )}
                      <span>{feature.menuTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value-Added Services Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-bold text-gray-700">增值服務</h3>
              </div>

              <div className="flex border border-border rounded-full overflow-hidden">
                <button
                  onClick={() => setNeedAddons(true)}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    needAddons ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted'
                  }`}
                >
                  需要
                </button>
                <button
                  onClick={() => setNeedAddons(false)}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    !needAddons ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted'
                  }`}
                >
                  不需要
                </button>
              </div>
            </div>

            {/* Expanded addon selection */}
            {needAddons && (
              <div className="mt-6">
                <p className="text-sm text-primary mb-4">
                  請選擇增值服務 <span className="text-primary">（可多選）</span>
                </p>

                <div className="space-y-3" suppressHydrationWarning>
                  {valueAddedServices.map(service => {
                    const isSelected = selectedServicesSafe[service.id] !== undefined;
                    const quantity = selectedServicesSafe[service.id] || 0;

                    return (
                      <div
                        key={service.id}
                        suppressHydrationWarning
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleService(service.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className="text-sm text-gray-700">{service.name}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-primary">
                            +
                            {(
                              {
                                rentSysPrice: plan.rentSysPrice,
                                venueSysPrice: plan.venueSysPrice,
                                accountingSysPrice: plan.accountingSysPrice,
                                custServiceSysPrice: plan.custServiceSysPrice,
                                addUnitPrice: plan.addUnitPrice
                              } as Record<string, number>
                            )[service.id] ?? 0}{' '}
                            HKD Each
                          </span>

                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(service.id, -1)}
                                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(service.id, 1)}
                                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="min-w-45 h-12 text-primary border-primary hover:bg-primary/5"
            >
              上一步
            </Button>
            <Button onClick={handleNext} className="min-w-45 h-12">
              下一步
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SelectPlan;
