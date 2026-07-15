import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(daily)/payroll/bonus-penalty')({
  component: RouteComponent,
  staticData: {
    title: '奖金/罚款'
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
