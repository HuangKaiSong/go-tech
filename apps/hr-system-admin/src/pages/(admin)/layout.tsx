import { AdminLayout as WebAdminLayout } from '@go-tech/web-admin-layouts';
import { NotificationButton } from '@go-tech/web-admin-notification';
import { DarkModeContainer } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import SystemLogo from '@/components/SystemLogo';
import UserAvatar from '@/features/auth/components/UserAvatar';
import { guardAdminRoute } from '@/features/router/guard';
import type { AdminRouteGuardOptions, AdminRouteGuardResult } from '@/features/router/guard';

const AdminFooter = () => {
  return <DarkModeContainer className="h-full flex-center">Copyright MIT © 2026 go-tech</DarkModeContainer>;
};

const AdminLayout = () => {
  const { t } = useTranslation();

  return (
    <WebAdminLayout
      footer={<AdminFooter />}
      headerMiddleActions={<NotificationButton className="px-12px" />}
      headerRightActions={<UserAvatar />}
      logo={<SystemLogo />}
      logoTitle={`HR ${t('system.title')}`}
    />
  );
};

function beforeLoadAdminRoute(options: AdminRouteGuardOptions): AdminRouteGuardResult {
  return guardAdminRoute(options);
}

export const Route = createFileRoute('/(admin)')({
  component: AdminLayout,
  beforeLoad: beforeLoadAdminRoute as any
});
