import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(daily)/payroll/distribute')({
  component: RouteComponent,
  staticData: {
    title: '发薪管理'
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
