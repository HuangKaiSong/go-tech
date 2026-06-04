import MobileLayout from "@/components/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import {
  ChevronRight,
  FileText,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: FileText, label: "打卡記錄", path: "/clock" },
  { icon: Shield, label: "安全設置", path: "#" },
  { icon: Settings, label: "通知設置", path: "#" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <MobileLayout title="我的">
      <div className="px-5 pt-4">
        {/* Avatar card */}
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">王小明</h2>
            <p className="text-sm text-muted-foreground">產品部 · 資深工程師</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              員工編號：EMP-20231042
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border mb-5">
          {[
            { icon: Phone, label: "手機", value: "0912-345-678" },
            { icon: Mail, label: "郵箱", value: "wang@company.com" },
            { icon: MapPin, label: "地址", value: "台北市信義區" },
          ].map((info) => (
            <div
              key={info.label}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <info.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-10">
                {info.label}
              </span>
              <span className="text-sm text-foreground flex-1">
                {info.value}
              </span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border mb-5">
          {/* Dark mode toggle */}
          <div className="flex items-center gap-3 px-4 py-3.5 w-full">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground flex-1 text-left">
              夜間模式
            </span>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-4 py-3.5 w-full"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1 text-left">
                {item.label}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => navigate("/")}
          className="w-full bg-card rounded-xl border border-border py-3.5 flex items-center justify-center gap-2 text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">退出登入</span>
        </button>
      </div>
    </MobileLayout>
  );
};

export default Profile;

