import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAuth } from "@/hooks/use-auth";
import { useLayoutEffect } from "react";
import { toast } from "sonner";

const AdminLayout = () => {
  const navigate = useNavigate()
  const { isExpired, isAuthenticated, token } = useAuth();
  const originFetch = window.fetch;

  useLayoutEffect(() => {
    if (isExpired && token) {
      toast.error("登录凭证已过期, 请重新登录");
      navigate('/login', {
        replace: true,
        state: {
          from: location.pathname,
        },
      })
      return
    }
    if (!isAuthenticated) {
      toast.error("请先登录");
      navigate('/login', {
        replace: true,
        state: {
          from: location.pathname,
        },
      })
      return
    }

    // 在fetch中添加header头
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      // 如果没有配置项，创建一个带headers的对象
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
          config.headers.append('Language', 'zh-TW')
        }
      }
      
      return originFetch(resource, config);
    };
    //组件卸载时恢复原始fetch
    return () => {
       window.fetch = originFetch;
    }
  }, [isExpired, isAuthenticated, token]);

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
