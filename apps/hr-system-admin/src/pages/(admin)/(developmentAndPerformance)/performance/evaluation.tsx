import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)/performance/evaluation')({
  component: RouteComponent,
  staticData: {
    title: '績效評估',
    menu: {
      order: 2
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
