import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui";
import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from '@/assets/background.webp'
import { toast } from "sonner";
import { useRouter } from "next/router";

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    verificationCode: "",
    pwd: "",
    verifyPwd: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step, setStep] = useState(0)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSendCode = async () => {
    if (!formData.email.trim()) {
      toast.error("請先輸入電子郵箱");
      return;
    }
    
    setIsSendingCode(true);
    // Simulate sending code
    setTimeout(() => {
      setIsSendingCode(false);
      toast.success("驗證碼已發送至您的郵箱");
    }, 1000);
  };

  const handlePrevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.company.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    
    if (!formData.verificationCode.trim()) {
      toast.error("請輸入驗證碼");
      return;
    }
    
    if (!acceptTerms) {
      toast.error("請接受服務條款");
      return;
    }
    
    setIsLoading(true);
    // Simulate registration - replace with actual auth logic
    setTimeout(() => {
      setIsLoading(false);
      setStep(1)
    }, 1000);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) return;

    if (!formData.pwd.trim() || !formData.verifyPwd.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    if (formData.pwd !== formData.verifyPwd) {
      toast.error("密碼和確認密碼不一致");
      return;
    }
    

    setIsLoading(true);
    // Simulate registration - replace with actual auth logic
    setTimeout(() => {
      setIsLoading(false);
      toast.success("註冊成功！");
      console.log(formData);
      
    }, 1000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <Image 
        src={authBgImg}
        alt="Background"
        className="absolute inset-0 h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      
      {/* Register Card */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl p-8 md:p-12 my-8">
        {/* Close Button */}
        <Link 
          href="/"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src={Logo} alt="logo" className="w-40 h-auto" loading="eager" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">
          注册新帳戶
        </h1>

        <form onSubmit={step === 1 ? handleSubmit : handlePrevSubmit} className="space-y-4">
          {
            step === 1 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder="請輸入密碼"
                    value={formData.pwd}
                    onChange={handleChange("pwd")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder="請再次輸入密碼"
                    value={formData.verifyPwd}
                    onChange={handleChange("verifyPwd")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? "處理中..." : "註冊"}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder="請輸入您的姓名"
                    value={formData.name}
                    onChange={handleChange("name")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="email"
                    placeholder="請輸入您的電子郵箱"
                    value={formData.email}
                    onChange={handleChange("email")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="tel"
                    placeholder="請輸入您的聯繫電話"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder="請輸入您的公司名稱"
                    value={formData.company}
                    onChange={handleChange("company")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">驗證碼</span>
                  <Input
                    type="text"
                    placeholder="請輸入郵箱收到的驗證碼"
                    value={formData.verificationCode}
                    onChange={handleChange("verificationCode")}
                    className="h-12 text-base border-border flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || !formData.email}
                    className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                  >
                    {isSendingCode ? "發送中..." : "發送驗證碼"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    接受{" "}
                    <a href="#" className="text-primary hover:underline">
                      《服務條款》
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? "處理中..." : "下一步"}
                </Button>
              </>
            )
          }
        </form>

        <div className="text-center mt-4 text-sm">
          <span className="text-muted-foreground">已有帳戶？</span>{" "}
          <Link href="/account/login" className="text-primary hover:underline">
            立即登入
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
