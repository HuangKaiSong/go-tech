import { LockKeyhole, LogOut, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceExpiry, type ServiceExpiry } from '@/api/service';
import { Button } from '@/components/ui/button';
import { SERVICE_EXPIRED_EVENT } from '@/lib/request';
import { clearToken } from '@/lib/auth';

/**
 * 服务到期全屏遮罩：request 拦截器捕获到业务码 402 后广播 SERVICE_EXPIRED_EVENT，
 * 本组件铺满整个窗口挡住业务区，避免各页面因请求失败反复 toast 刷屏。
 * 续费由平台侧完成，这里只提供「重新登入」入口（续费后重新登录即恢复）。
 */
export function ServiceExpiredOverlay() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState<ServiceExpiry | null>(null);

  useEffect(() => {
    const onExpired = () => {
      setVisible(true);
      // 到期查询接口不受 402 拦截，拉一次拿到期日展示
      getServiceExpiry()
        .then(res => setInfo(res.data ?? null))
        .catch(() => setInfo(null));
    };
    window.addEventListener(SERVICE_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SERVICE_EXPIRED_EVENT, onExpired);
  }, []);

  if (!visible) return null;

  const handleRelogin = () => {
    clearToken();
    window.location.href = '/login';
  };

  // 立即续费：清登录态并跳转平台首页，由用户在平台自助续费
  const handleRenew = () => {
    if (!info?.renewUrl) return;
    clearToken();
    window.location.href = info.renewUrl;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <LockKeyhole className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">{t('服務已到期')}</h2>
        <p className="mb-1 text-sm text-muted-foreground">
          {info?.expireDate
            ? t('您的服務已於 {{date}} 到期，暫無法使用 HR 系統功能。', { date: info.expireDate })
            : t('您的服務已到期，暫無法使用 HR 系統功能。')}
        </p>
        <p className="mb-6 text-sm text-muted-foreground">{t('請前往平台完成續費後重新登入。')}</p>
        <div className="flex flex-col gap-2">
          {info?.renewUrl && (
            <Button className="w-full" onClick={handleRenew}>
              <CreditCard className="mr-1.5 h-4 w-4" />
              {t('立即續費')}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={handleRelogin}>
            <LogOut className="mr-1.5 h-4 w-4" />
            {t('重新登入')}
          </Button>
        </div>
      </div>
    </div>
  );
}
