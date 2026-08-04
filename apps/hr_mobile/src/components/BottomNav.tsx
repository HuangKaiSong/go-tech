import { useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, FileText, Bell, User, BookUser } from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "首頁" },
  { path: "/clock", icon: Clock, label: "打卡" },
  { path: "/contacts", icon: BookUser, label: "通訊錄" },
  { path: "/notifications", icon: Bell, label: "通知" },
  { path: "/profile", icon: User, label: "我的" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-6.5 h-6.5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
