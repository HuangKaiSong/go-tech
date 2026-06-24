import { ChevronRight, FileImage, Settings, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const menuItems = [
  {
    title: '角色管理',
    description: '管理系統角色與權限設定',
    icon: Shield,
    path: '/settings/roles'
  },
  {
    title: '用戶管理',
    description: '管理系統後台用戶帳號',
    icon: Users,
    path: '/settings/users'
  },
  {
    title: '圖文管理',
    description: '管理網站圖片與文字內容',
    icon: FileImage,
    path: '/settings/content'
  }
];

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">系統設定</h1>
      </div>

      <div className="grid gap-4">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
