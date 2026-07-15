import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(daily)')({
  component: RouteComponent,
  staticData: {
    menu: {
      type: 'group',
      order: 6
    },
    title: '日常管理'
  }
});

function RouteComponent() {
  return <Outlet />;
}
