import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CreditCard, ShieldCheck, Sparkles, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getServiceExpiry } from '@/api/service';

/** 顶栏基础服务有效期横幅：有套餐記錄即常顯，臨近到期(warning)轉琥珀、已過期轉紅色。 整條通欄，置於頂部 header 上方。 */
export function ServiceExpiryBanner() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['service-expiry'],
    queryFn: () => getServiceExpiry().then(res => res.data ?? null),
    staleTime: 5 * 60 * 1000,
    // 每次挂载（含每次登录进入应用）都重新请求，保证按当前租户拿最新到期状态
    refetchOnMount: 'always',
    refetchOnWindowFocus: false
  });

  if (!data) return null;

  // 试用租户（租户ID=000000）：常显试用版提示条，右侧引导购买套餐
  if (data.trial) {
    const buyTrial = () => {
      if (data.renewUrl) window.open(data.renewUrl, '_blank', 'noopener');
    };
    return (
      <div className="flex items-center gap-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2.5 text-sm text-foreground/80 md:pr-48">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {t('試用版')}
        </span>
        <span>
          {t('您正在使用 HRM 管理系統 免費試用環境，資料僅供體驗，購買套餐後即可正式使用。')}
        </span>
        {data.renewUrl && (
          <button
            type="button"
            onClick={buyTrial}
            className="ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t('立即購買套餐')}
          </button>
        )}
      </div>
    );
  }

  // 仅在临近到期（剩余 ≤ 阈值天数）或已过期时提示，平时不显示
  if (!data.warning) return null;

  const { expired, warning, expireDate, remainingDays, serviceItem, renewUrl } = data;

  // 三态配色：正常品牌橙 / 临近到期琥珀 / 已过期红
  const tone = expired
    ? {
        bar: 'from-rose-50 to-transparent border-rose-200/70',
        badge: 'bg-white text-rose-600 ring-rose-200',
        icon: 'text-rose-500',
        pill: 'bg-rose-500 text-white',
        btn: 'bg-rose-500 hover:bg-rose-600 text-white'
      }
    : warning
      ? {
          bar: 'from-amber-50 to-transparent border-amber-200/70',
          badge: 'bg-white text-amber-700 ring-amber-200',
          icon: 'text-amber-500',
          pill: 'bg-amber-500 text-white',
          btn: 'bg-amber-500 hover:bg-amber-600 text-white'
        }
      : {
          bar: 'from-orange-50 to-transparent border-orange-200/70',
          badge: 'bg-white text-orange-700 ring-orange-200',
          icon: 'text-orange-500',
          pill: 'bg-orange-500 text-white',
          btn: 'bg-orange-500 hover:bg-orange-600 text-white'
        };

  // 未到期时仍在正常使用，续费另开页签不打断当前操作
  const handleRenew = () => {
    if (renewUrl) window.open(renewUrl, '_blank', 'noopener');
  };

  return (
    <div
      className={`flex items-center gap-3 border-b bg-gradient-to-r px-4 py-2.5 text-sm text-foreground/80 md:pr-48 ${tone.bar}`}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tone.badge}`}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {serviceItem || t('服務')}
      </span>

      <CalendarClock className={`h-4 w-4 flex-shrink-0 ${tone.icon}`} />

      {expired ? (
        <span>{t('您的服務已於 {{date}} 到期，到期後將無法繼續使用。', { date: expireDate })}</span>
      ) : (
        <span className="flex items-center gap-2">
          <span>{t('您的服務有效期至 {{date}}，到期後將無法繼續使用。', { date: expireDate })}</span>
          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${tone.pill}`}>
            {t('剩餘 {{days}} 天', { days: remainingDays })}
          </span>
        </span>
      )}

      {renewUrl && (
        <button
          type="button"
          onClick={handleRenew}
          className={`ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${tone.btn}`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          {t('立即續費')}
        </button>
      )}
    </div>
  );
}
