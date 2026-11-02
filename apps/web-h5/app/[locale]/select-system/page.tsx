'use client';

import type { PackageBizCode } from '@go-tech/types';
import { Button, toast } from '@go-tech/web-ui';
import { ArrowLeft, ArrowRight, Building2, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { openTrialEnvironment } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialWindow } from '@/contexts/TrialWindowContext';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { isNotifiedClientHttpError } from '@/lib/client-http/client-http-error';

const systems = [
  {
    key: 'pms',
    name: 'GO-PMS 租務系統',
    tag: '物業 · 租務 · 場務',
    desc: '物業、租約、跟進、水電與會計一站式管理，讓租務團隊高效協作。',
    points: ['物業與單位管理', '合約到期與續租提醒', '跟進工單與客服列表', '水電與會計對接'],
    icon: Building2
  },
  {
    key: 'hr',
    name: 'GO-HR 人力資源系統',
    tag: '人事 · 薪資 · 績效',
    desc: '員工資料、入職離職、考勤假期、薪資績效與培訓管理，一站式處理。',
    points: ['員工與入離職管理', '考勤打卡與假期審批', '薪資計算與發薪管理', '績效評估與培訓記錄'],
    icon: Users
  }
];

const SelectSystem = () => {
  const router = useProgressRouter();
  const { token } = useAuth();
  const { openPmsCallback } = useTrialWindow();

  const [selected, setSelected] = useState<string | null>(null);
  const current = systems.find(system => system.key === selected);

  const requestHeaders = () =>
    new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Type': 'platform_customer'
    });

  const handleExclusiveTrial = async (product?: string) => {
    const bizcode = product || current?.key;
    const headers = requestHeaders();
    const toastId = toast.loading('正在進入专属试用系統');

    try {
      // 创建订单
      const response = await clientFetch(
        `/go-tech/platform/packageOrder/exclusiveTrail?bizCode=${bizcode}`,
        {
          method: 'GET',
          headers
        },
        { feedbackId: toastId }
      );
      const responseData = await response.json();
      openTrialEnvironment({
        bizCode: bizcode as PackageBizCode,
        code: responseData.data,
        generateCallback: openPmsCallback,
        pmsCallbackPath: 'tenantCallback'
      });
      toast.success('专属试用系統已成功打开', { id: toastId });
    } catch (error) {
      if (!isNotifiedClientHttpError(error)) toast.error('', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-foreground text-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-52 -right-32 w-[560px] h-[560px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative container mx-auto px-4 py-10 md:py-16">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-background/70 hover:text-background hover:bg-background/10 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block text-xs tracking-widest uppercase text-primary mb-3">Start Free Trial</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">請選擇要試用的系統</h1>
          <p className="text-background/70">兩套系統均提供 14 天免費試用，選擇後即可進入對應的系統界面體驗完整功能。</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {systems.map(s => {
            const isSelected = selected === s.key;
            const dimmed = selected !== null && !isSelected;
            return (
              <button
                key={s.key}
                onClick={() => setSelected(s.key)}
                type="button"
                aria-pressed={isSelected}
                onDoubleClick={() => handleExclusiveTrial(s.key)}
                className={`group relative text-left rounded-2xl border p-6 md:p-8 transition-all duration-300 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_50px_-12px_hsl(var(--primary))] scale-[1.02]'
                    : 'border-background/15 bg-background/5 hover:border-background/40'
                } ${dimmed ? 'opacity-40 saturate-50 blur-[0.4px] scale-[0.98]' : 'opacity-100'}`}
              >
                {isSelected && (
                  <span className="absolute top-5 right-5 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </span>
                )}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-background/10 text-primary'
                  }`}
                >
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="text-xs tracking-wide text-primary mb-2">{s.tag}</div>
                <h2 className="text-2xl font-bold mb-2">{s.name}</h2>
                <p className="text-sm text-background/70 leading-relaxed mb-5">{s.desc}</p>
                <ul className="space-y-2">
                  {s.points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-background/80">
                      <Check className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-background/40'}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button size="lg" disabled={!current} onClick={() => handleExclusiveTrial()} className="min-w-64">
            {current ? `進入${current.name}` : '請先選擇系統'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-background/50">提示：雙擊卡片可直接進入該系統</p>
        </div>
      </div>
    </div>
  );
};

export default SelectSystem;
