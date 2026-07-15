import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(analysisAndSetting)/settings')({
  component: RouteComponent,
  staticData: {
    title: '系統管理',
    menu: {
      order: 3,
      icon: 'lucide:settings'
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  return <LookForward title={t('common.lookForward')} />;
}
