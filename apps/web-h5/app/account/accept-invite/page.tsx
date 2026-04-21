'use client'

import Link from "@/app/components/Link";
import authBackground from "@/assets/auth-background.jpg";
// import LogoImg from "@/assets/Gotech_Logo.webp";
import { Button } from "@go-tech-frontend/ui";
import { LogIn, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Step = "choose" | "register" | "login" | "success";

const AcceptInvite = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // const token = searchParams.get("token");
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState<Step>("choose");

  // if (!token) {
  //   return (
  //     <div className="min-h-screen relative flex items-center justify-center p-4">
  //       <Image
  //         src={authBackground}
  //         alt="Background"
  //         className="absolute inset-0 w-full h-full object-cover"
  //         fill
  //         priority
  //     />
  //       <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
  //       <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-12 text-center">
  //         <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <span className="text-3xl">⚠️</span>
  //         </div>
  //         <h1 className="text-xl font-bold mb-2">邀請鏈接無效</h1>
  //         <p className="text-muted-foreground mb-6">此邀請鏈接已過期或無效，請聯繫管理員重新發送邀請。</p>
  //         <Button onClick={() => router.push("/")}>返回首頁</Button>
  //       </div>
  //     </div>
  //   );
  // }

  const Logo = () => (
    <div className="flex flex-col items-center mb-8">
      <Image
        src="/images/Gotech_Logo.webp"
        alt="logo"
        className="w-40 h-auto"
        loading="eager"
        width={160}
        height={160}
      />
    </div>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <Image
        src={authBackground}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        fill
        priority
      />
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-12 my-8">
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-6 h-6" />
        </Link>

        <Logo />

        {/* Choose: register or login */}
        {step === "choose" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">接受邀請</h1>
              <p className="text-sm text-muted-foreground">您已被邀請加入 Go Techs 系統</p>
              <p className="text-sm text-muted-foreground mt-1">邀請郵箱：<span className="font-medium text-foreground">{email}</span></p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  router.push(`/account/register?email=${email}&type=user`)
                }}
                className="w-full h-14 text-lg font-semibold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                註冊新帳戶
              </Button>
              <div className="relative flex items-center justify-center">
                <div className="border-t border-border flex-1" />
                <span className="px-3 text-sm text-muted-foreground bg-background">或</span>
                <div className="border-t border-border flex-1" />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/account/login?email=${email}&type=user`)
                }}
                className="w-full h-14 text-lg font-semibold"
              >
                <LogIn className="w-5 h-5 mr-2" />
                已有帳戶，登錄接受
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
    </div>
  );
};

export default AcceptInvite;
