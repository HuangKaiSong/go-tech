import { Button, Input } from "@go-tech-frontend/ui";
import { useAuth } from "@/hooks/use-auth";
import Dotline from "@/hooks/use-dotline"
import { useMutation } from "@tanstack/react-query";
import { useKeyPress } from "ahooks";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 获取来源页面路径
  const from = location.state?.from || '/';

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!account || !password) {
        throw new Error("請填寫所有欄位");
      }
      const response = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: account,
          password,
        }),
      })
      return response.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (result) => {
      if (result && result.code === 200) {
        setIsLoading(false);

        setToken(result.data.token)

        navigate(from, { replace: true });
      } else {
        setIsLoading(false);
        console.log(result);
        
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);      
      setIsLoading(false);
    }
  })

  useKeyPress(['Enter'], () => {
    loginMutation.mutate()
  })

  useEffect(() => {
    new Dotline({ dom: 'dotline', cw: 2000, ch: 1000, ds: 150 }).start()
  }, [])

  return (
    <div className="h-screen w-full overflow-hidden relative">
      <canvas id="dotline"></canvas>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-100 rounded-xl bg-light-50 shadow-xl p-10">
        <h1 className="text-2xl font-bold text-center text-foreground mb-8">账户登录</h1>
        <div className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="請輸入您的電子郵箱/手機號碼"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="h-14 text-base border-border"
            />
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="請輸入您的密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-base border-border pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !account || !password}
            onClick={() => loginMutation.mutate()}
            className="w-full h-14 text-lg font-semibold bg-primary/80 hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
          >
            {isLoading ? "登入中..." : "登入"}
          </Button>

        </div>
      </div>
    </div>
  )
}

export default Login