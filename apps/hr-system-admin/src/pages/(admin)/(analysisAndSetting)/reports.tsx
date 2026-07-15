import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(analysisAndSetting)/reports')({
  component: RouteComponent,
  staticData: {
    title: '報表分析',
    menu: {
      order: 2,
      icon: 'lucide:bar-chart-3'
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}

