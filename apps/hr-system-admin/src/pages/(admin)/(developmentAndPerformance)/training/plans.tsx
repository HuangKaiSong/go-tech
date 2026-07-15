import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)/training/plans')({
  component: RouteComponent,
  staticData: {
    title: '培訓計劃',
    menu: {
      order: 1
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
