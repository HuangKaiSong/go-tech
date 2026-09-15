import { Building2, Loader2, Lock, LogIn, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login, loginByCode, type LoginResult } from '@/api/employee';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setPerms, setRoutes, setToken, setUser } from '@/lib/auth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  // 平台跳转免密登录中：显示整页加载态，避免闪出账号密码表单
  const [ssoLoading, setSsoLoading] = useState(false);
  const navigate = useNavigate();

  // 缓存登录态（token/用户/路由/权限），密码登录与免密登录共用
  const applySession = (data: LoginResult) => {
    setToken(`${data.tokenHead}${data.token}`);
    setUser({ userId: data.userId, userName: data.userName, employeeNo: data.employeeNo });
    setRoutes(data.routes);
    setPerms(data.perms);
  };

  // 平台开通 HR 后携带一次性 code 跳转进来：读取 code 免密登录，成功后进首页
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    setSsoLoading(true);
    loginByCode(code)
      .then(res => {
        applySession(res.data);
        toast.success('登入成功');
        navigate('/', { replace: true });
      })
      .catch((err: any) => {
        toast.error(err.message || '免密登入失敗，請手動登入');
        // 去掉 URL 上的 code，避免刷新重复用已失效的 code
        window.history.replaceState(null, '', window.location.pathname);
        setSsoLoading(false);
      });
    // oxlint-disable-next-line react/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { password?: string; phone?: string } = {};
    if (!phone.trim()) next.phone = '請輸入手機號';
    if (!password) next.password = '請輸入密碼';
    setErrors(next);
    if (next.phone || next.password) return;
    setLoading(true);
    try {
      applySession(res.data);
      toast.success('登入成功');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  if (ssoLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在登入，請稍候...</p>
      </div>
    );
  }

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
              <Label htmlFor="phone" className="text-sm">
                手機號
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className={`pl-9 ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="請輸入手機號"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(p => ({ ...p, phone: undefined }));
                  }}
                  autoComplete="username"
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                密碼
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className={`pl-9 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                  }}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LogIn className="h-4 w-4 mr-1" />}
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
