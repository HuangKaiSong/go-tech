import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, LogIn, Loader2, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/api/employee";
import { setToken, setUser, setRoutes, setPerms } from "@/lib/auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { phone?: string; password?: string } = {};
    if (!phone.trim()) next.phone = "請輸入手機號";
    if (!password) next.password = "請輸入密碼";
    setErrors(next);
    if (next.phone || next.password) return;
    setLoading(true);
    try {
      const res = await login({ phone: phone.trim(), password });
      // 存入完整 Authorization 值：tokenHead + token
      setToken(`${res.data.tokenHead}${res.data.token}`);
      // 緩存當前登入用戶信息，供「負責HR」等場景直接讀取，無需再調接口
      setUser({ userId: res.data.userId, userName: res.data.userName, employeeNo: res.data.employeeNo });
      // 緩存可存取菜單路由，供側邊欄按權限過濾
      setRoutes(res.data.routes);
      // 緩存權限碼集合，供頁簽可見/欄位編輯/敏感脫敏控制
      setPerms(res.data.perms);
      toast.success("登入成功");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">HR 管理系統</CardTitle>
            <CardDescription>員工登入</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">手機號</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="phone" className={`pl-9 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="請輸入手機號"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                  autoComplete="username" />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" className={`pl-9 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                  autoComplete="current-password" />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LogIn className="h-4 w-4 mr-1" />}
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
