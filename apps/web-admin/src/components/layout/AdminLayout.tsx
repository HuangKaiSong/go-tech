import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isExpired, token } = useAuth();
  const originFetch = window.fetch;

  useLayoutEffect(() => {
    if (isExpired && token) {
      toast.error('登录凭证已过期, 请重新登录');
      requestAnimationFrame(() => {
        navigate('/login', {
          state: {
            from: location.pathname
          }
        });
      });
      return;
    }
    if (!isAuthenticated) {
      toast.error('请先登录');
      requestAnimationFrame(() => {
        navigate('/login', {
          replace: true,
          state: {
            from: location.pathname
          }
        });
      });
      return;
    }

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
          config.headers.append('Authorization', `Bearer ${token}`);
          config.headers.append('Language', 'zh-TW');
        }
      }

      return originFetch(resource, config);
    };
    //组件卸载时恢复原始fetch
    return () => {
      window.fetch = originFetch;
    };
  }, [isExpired, isAuthenticated, token, navigate, originFetch]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
