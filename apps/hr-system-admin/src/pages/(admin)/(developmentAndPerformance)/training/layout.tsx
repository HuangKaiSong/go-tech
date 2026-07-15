import { normalizePath } from '@go-tech/web-admin-layouts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(admin)/(developmentAndPerformance)/training')({
  component: RouteComponent,
  staticData: {
    menu: {
      order: 3,
      icon: 'lucide:graduation-cap'
    },
    title: '培訓管理'
  },
  beforeLoad: ({ location }) => {
    // 仅在访问 /payroll 本身时跳转到默认子页;
    // 子路由 /payroll/* 不跳转,否则会造成重定向死循环、页面卡死。
    if (normalizePath(location.pathname) === '/performance') {
      throw redirect({ to: '/performance/plans' });
    }
  }
});

function RouteComponent() {
  return <Outlet />;
}
