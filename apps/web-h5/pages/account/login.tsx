import { useState } from "react";
import { Button, Input } from "@go-tech-frontend/ui";
import { toast } from "sonner";
import { useRouter } from 'next/router'
import Link from "@/components/Link";
import Image from "next/image";

import { Eye, EyeOff, X } from "lucide-react";
import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from '@/assets/background.webp'

const Login = () => {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account.trim() || !password.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }
    
    setIsLoading(true);
    // Simulate login - replace with actual auth logic
    setTimeout(() => {
      setIsLoading(false);
      toast.success("登入成功！");
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <Image 
        src={authBgImg}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      
      {/* Login Card */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl p-8 md:p-12">
        {/* Close Button */}
        <Link 
          href="/"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src={Logo} alt="logo" className="w-40" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-8">
          登入您的帳戶
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full h-14 text-lg font-semibold bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
          >
            {isLoading ? "登入中..." : "登入"}
          </Button>
        </form>

        <div className="flex items-center justify-between mt-6 text-sm">
          <div className="flex gap-6">
            <Link href="/account/forget-password" className="text-foreground underline hover:text-primary transition-colors">
              忘記密碼?
            </Link>
            <Link href="#" className="text-foreground underline hover:text-primary transition-colors">
              無法登入?
            </Link>
          </div>
          <Link href="/account/register" className="text-foreground underline hover:text-primary transition-colors">
            註冊新帳戶
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 py-4">
        <div className="flex justify-center gap-8 text-sm text-background/80">
          <Link href="#" className="hover:text-background transition-colors">安全佈告欄</Link>
          <Link href="#" className="hover:text-background transition-colors">使用條款</Link>
          <Link href="#" className="hover:text-background transition-colors">隱私條例</Link>
          <Link href="#" className="hover:text-background transition-colors">幫助中心</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
