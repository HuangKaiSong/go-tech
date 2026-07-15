import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)/performance/plans')({
  component: RouteComponent,
  staticData: {
    title: '考核方案',
    menu: {
      order: 1
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
