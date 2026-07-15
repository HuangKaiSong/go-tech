import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(personnel)')({
  component: RouteComponent,
  staticData: {
    i18nKey: 'route.personnel',
    menu: {
      type: 'group',
      order: 2
    }
  }
});

function RouteComponent() {
  return <Outlet />;
}
