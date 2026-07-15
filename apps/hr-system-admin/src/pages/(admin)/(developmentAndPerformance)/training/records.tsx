import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)/training/records')({
  component: RouteComponent,
  staticData: {
    title: '培訓紀錄',
    menu: {
      order: 2
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
