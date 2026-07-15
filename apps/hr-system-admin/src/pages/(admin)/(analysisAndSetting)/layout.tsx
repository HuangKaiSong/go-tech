import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(analysisAndSetting)')({
  component: RouteComponent,
  staticData: {
    menu: {
      type: 'group',
      order: 99
    },
    title: '分析與設定'
  }
});

function RouteComponent() {
  return <Outlet />;
}
