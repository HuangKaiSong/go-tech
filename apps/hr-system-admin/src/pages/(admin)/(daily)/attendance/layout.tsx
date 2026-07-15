import { normalizePath } from '@go-tech/web-admin-layouts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const FunctionLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute('/(admin)/(daily)/attendance')({
  component: FunctionLayout,
  staticData: {
    menu: {
      type: 'item',
      order: 2,
      icon: 'lucide:clock'
    },
    title: '行政管理'
  },
  beforeLoad: ({ location }) => {
    // 仅在访问 /attendance 本身时跳转到默认子页;
    // 子路由 /attendance/* 不跳转,否则会造成重定向死循环、页面卡死。
    if (normalizePath(location.pathname) === '/attendance') {
      throw redirect({ to: '/attendance/clock-in' });
    }
  }
});
