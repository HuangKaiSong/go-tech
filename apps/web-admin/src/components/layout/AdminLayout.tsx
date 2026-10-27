import { useLayoutEffect } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { token } = useAuth();
  // 手册和博客工作区锁定视口高度，其他后台页面继续沿用原来的整页滚动。
  const isManual = useMatch('/manual') !== null;
  const isBlog = useMatch('/blog') !== null;
  const isManualWorkspace = isManual || isBlog;

  useLayoutEffect(() => {
    const originFetch = window.fetch;

    // 在fetch中添加header头
    window.fetch = async (...args: [RequestInfo | URL, RequestInit?]) => {
      // eslint-disable-next-line prefer-const
      let [resource, config] = args;

      if (!config) {
        config = {};
      }

      // 确保headers存在
      if (!config.headers) {
        config.headers = new Headers();
      } else if (config.headers instanceof Headers) {
        // Headers实例无需处理
      } else {
        config.headers = new Headers(config.headers);
      }

      // 添加认证token到请求头
      if (token) {
        if (config.headers instanceof Headers) {
          // Request-specific credentials take precedence; append would produce an invalid comma-separated JWT.
          if (!config.headers.has('Authorization')) {
            config.headers.set('Authorization', `Bearer ${token.replace(/^Bearer\s+/i, '')}`);
          }
          if (!config.headers.has('Language')) {
            config.headers.set('Language', 'zh-TW');
          }
        }
      }

      return originFetch(resource, config);
    };
    //组件卸载时恢复原始fetch
    return () => {
      window.fetch = originFetch;
    };
  }, [token]);

  return (
    <div
      className={
        isManualWorkspace
          ? 'flex h-dvh overflow-hidden bg-background [&>aside]:h-full [&>aside]:min-h-0 [&>aside]:shrink-0 [&>aside]:overflow-y-auto [&>aside]:overscroll-contain'
          : 'flex min-h-screen bg-background'
      }
    >
      <AdminSidebar />
      <div
        className={`flex-1 flex flex-col ${isManualWorkspace ? 'min-h-0 min-w-0 overflow-hidden [&>header]:shrink-0' : ''}`}
      >
        <AdminHeader />
        <main className={isManualWorkspace ? 'flex-1 min-h-0 overflow-hidden p-4 lg:p-6' : 'flex-1 p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
