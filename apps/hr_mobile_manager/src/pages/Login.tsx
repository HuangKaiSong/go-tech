import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Smartphone } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header gradient */}
      <div className="relative h-72 bg-gradient-to-br from-primary to-primary/70 dark:from-[hsl(220,25%,14%)] dark:to-[hsl(220,20%,18%)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground/20" />
          <div className="absolute bottom-5 right-5 w-48 h-48 rounded-full bg-primary-foreground/10" />
        </div>
        <div className="text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">HR 管理系統</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">企業人力資源管理平台</p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 -mt-8 rounded-t-3xl bg-background px-6 pt-8 pb-6">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="account" className="text-sm font-medium text-foreground">帳號</Label>
            <Input
              id="account"
              placeholder="請輸入帳號或手機號碼"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-0 px-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">密碼</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-0 px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button type="button" className="text-sm text-primary font-medium">
              忘記密碼？
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            {isLoading ? "登入中..." : "登入"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="px-3 text-xs text-muted-foreground">其他登入方式</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* SSO options */}
        <div className="flex justify-center gap-6">
          {[
            { icon: <Smartphone className="w-5 h-5" />, label: "手機驗證" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-1.5 text-muted-foreground"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          v1.0.0 · 登入即表示同意服務條款
        </p>
      </div>
    </div>
  );
};

export default Login;
