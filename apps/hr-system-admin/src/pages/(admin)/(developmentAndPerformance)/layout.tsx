import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)')({
  component: RouteComponent,
  staticData: {
    menu: {
      type: 'group',
      order: 8
    },
    title: '發展與績效'
  }
});

function RouteComponent() {
  return <Outlet />;
}
