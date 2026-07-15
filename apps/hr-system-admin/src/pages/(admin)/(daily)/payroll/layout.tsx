import { normalizePath } from '@go-tech/web-admin-layouts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const FunctionLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute('/(admin)/(daily)/payroll')({
  component: FunctionLayout,
  staticData: {
    menu: {
      type: 'item',
      order: 3,
      icon: 'lucide:dollar-sign'
    },
    title: '薪资管理'
  },
  beforeLoad: ({ location }) => {
    // 仅在访问 /payroll 本身时跳转到默认子页;
    // 子路由 /payroll/* 不跳转,否则会造成重定向死循环、页面卡死。
    if (normalizePath(location.pathname) === '/payroll') {
      throw redirect({ to: '/payroll/calculate' });
    }
  }
});
