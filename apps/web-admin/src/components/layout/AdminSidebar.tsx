import { cn } from '@go-tech/core-utils';
import { ChevronDown, ChevronRight, FileText, Gift, MessageSquareText, Package, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '@/assets/images/Gotech_Logo.webp';

interface MenuItem {
  children?: { path: string; title: string }[];
  icon: React.ElementType;
  path?: string;
  title: string;
}

const menuItems: MenuItem[] = [
  { title: '客戶列表', path: '/customers', icon: Users },
  { title: '訂單列表', path: '/orders', icon: FileText },
  // { title: "系統用戶列表", path: "/system-users", icon: UserCog },
  { title: '留言板', path: '/message-board', icon: MessageSquareText },
  {
    title: '優惠管理',
    icon: Gift,
    children: [
      { title: '優惠活動', path: '/promotions' },
      { title: '優惠碼', path: '/promo-codes' },
      { title: '優惠券', path: '/coupons' }
    ]
  },
  { title: '套餐內容設定', path: '/packages', icon: Package },
  {
    title: '系統設定',
    icon: Settings,
    children: [
      { title: '角色管理', path: '/settings/roles' },
      { title: '用戶管理', path: '/settings/users' },
      // { title: "圖文管理", path: "/settings/content" },
      { title: '站點設置', path: '/settings/site/h5' }
    ]
  }
];

const AdminSidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['優惠管理']);

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => (prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isChildActive = (children?: { path: string; title: string }[]) => {
    if (!children) return false;
    return children.some(child => location.pathname === child.path);
  };

  return (
    <aside className="w-50 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 border-b border-sidebar-border">
        {/* <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">Go Techs</span>
        </div> */}
        <img alt="logo" loading="lazy" width="85" height="85" decoding="async" src={Logo}></img>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {menuItems.map(item => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isChildActive(item.children) && 'text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {expandedMenus.includes(item.title) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedMenus.includes(item.title) && (
                    <ul className="ml-8 space-y-1">
                      {item.children.map(child => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={cn(
                              'block px-4 py-2 text-sm transition-colors rounded-md',
                              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              isActive(child.path) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path!}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive(item.path) &&
                      'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-4 border-primary'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
