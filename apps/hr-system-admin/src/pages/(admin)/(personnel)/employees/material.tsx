import { LookForward } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';

const RouteComponent = () => {
  const { t } = useTranslation();

  return <LookForward title={t('common.lookForward')} />;
};

export const Route = createFileRoute('/(admin)/(personnel)/employees/material')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:user-round-search'
    },
    title: '员工资料'
  }
});
