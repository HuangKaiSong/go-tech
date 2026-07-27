import { toast } from '@go-tech-frontend/ui';
import { useRouter } from 'next/router';
import { useLayoutEffect } from 'react';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useIframeContext } from '../../contexts/IframeContext';

interface Props {
  children: React.ReactNode;
}

export const WithIframeRestriction: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const { hasIframe } = useIframeContext();
  const iframeRouteWarning = useBatchTranslation('在 iframe 中無法使用路由功能');

  useLayoutEffect(() => {
    if (hasIframe) {
      // 阻止路由跳转
      const handleRouteChange = () => {
        router.replace(router.asPath);
        toast.warning(iframeRouteWarning);
      };

      router.events.on('routeChangeStart', handleRouteChange);

      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }
  }, [hasIframe, router]);

  return children;
};
