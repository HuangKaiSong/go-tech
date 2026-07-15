import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

const RouteComponent = () => {
  const { t } = useTranslation();

  return <LookForward title={t('common.lookForward')} />;
};

export const Route = createFileRoute('/(admin)/(personnel)/employees/offboarding')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:user-round-x'
    },
    title: '离职管理'
  }
});
