import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getServiceExpiry } from '@/api/service';

/**
 * 顶栏基础服务有效期横幅：有套餐記錄即常顯，臨近到期(warning)轉琥珀、已過期轉紅色。
 * 整條通欄，置於頂部 header 上方。
 */
export function ServiceExpiryBanner() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['service-expiry'],
    queryFn: () => getServiceExpiry().then(res => res.data ?? null),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  if (!data) return null;

  const { expired, warning, expireDate, remainingDays, serviceItem } = data;

  // 三态配色：正常品牌橙 / 临近到期琥珀 / 已过期红
  const tone = expired
    ? {
        bar: 'from-rose-50 to-transparent border-rose-200/70',
        badge: 'bg-white text-rose-600 ring-rose-200',
        icon: 'text-rose-500',
        pill: 'bg-rose-500 text-white'
      }
    : warning
      ? {
          bar: 'from-amber-50 to-transparent border-amber-200/70',
          badge: 'bg-white text-amber-700 ring-amber-200',
          icon: 'text-amber-500',
          pill: 'bg-amber-500 text-white'
        }
      : {
          bar: 'from-orange-50 to-transparent border-orange-200/70',
          badge: 'bg-white text-orange-700 ring-orange-200',
          icon: 'text-orange-500',
          pill: 'bg-orange-500 text-white'
        };

  return (
    <div
      className={`flex items-center gap-3 border-b bg-gradient-to-r px-4 py-2.5 text-sm text-foreground/80 ${tone.bar}`}
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
    </div>
  );
}
