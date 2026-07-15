import { normalizePath } from '@go-tech/web-admin-layouts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const FunctionLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute('/(admin)/(personnel)/organization')({
  component: FunctionLayout,
  staticData: {
    // i18nKey: 'route.personnel_organize',
    menu: {
      icon: 'lucide:building-2',
      order: 2
    },
    title: '组织架构'
  },
  beforeLoad: ({ location }) => {
    // 仅在访问 /employees 本身时跳转到默认子页(员工资料);
    // 子路由 /employees/* 不跳转,否则会造成重定向死循环、页面卡死。
    if (normalizePath(location.pathname) === '/organization') {
      throw redirect({ to: '/organization/departments' });
    }
  }
});
