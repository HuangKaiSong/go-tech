"use client";

import Link from "@/app/components/Link";
import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from "@/assets/background.webp";
import { sendToBetterStack } from "@/lib/betterstack-logger";
import { useCountDown } from "@go-tech-frontend/lib";
import { Button, Checkbox, Input } from "@go-tech-frontend/ui";
import { CircleAlert, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@go-tech-frontend/ui";
import z from "zod";

const verificationCodeSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email({ message: "请输入正确的邮箱" })
    .trim(),
});

const signupSchema = verificationCodeSchema.extend({
  name: z
    .string({ required_error: "请输入用户名" })
    .min(2, "请输入用户名")
    .max(50)
    .trim(),
  phone: z
    .string({ required_error: "請輸入電話" })
    .min(1, "請輸入電話")
    .min(7, "電話至少需要7個字符")
    .trim(),
  company: z.string({ required_error: "请输入公司名称" }).min(2).max(50).trim(),
  verificationCode: z
    .string({ message: "请输入验证码" })
    .min(1, "请输入验证码")
    .length(6)
    .trim(),
});

const signupSchema2 = signupSchema
  .extend({
    password: z
      .string()
      .min(6, "密码至少需要6位字符")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/,
        "密码需至少包含一个字母、一个数字和一个特殊字符"
      )
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "密码不一致",
    path: ["confirmPassword"],
  });

const EXISTING_EMAIL_MESSAGE = "該郵箱已被註冊，請直接登入或使用忘記密碼。";

const Register = () => {
  const router = useRouter();

  const [targetDate, setTargetDate] = useState<number>();

  const [countdown] = useCountDown({
    targetDate,
    onEnd() {
      setTargetDate(undefined)
    },
  });

  const [pending, setPending] = useState(false);
  const [validatedPending, setValidatedPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState(0);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      if (field === "email") {
        setEmailExists(false);
        setCheckedEmail("");
      }
    };

  const isCodeButtonDisabled =
    pending || countdown > 0 || !formData.email || emailChecking || emailExists;
  const isEmailAvailable =
    !!formData.email &&
    checkedEmail === formData.email &&
    !emailChecking &&
    !emailExists;

  const parseEmailExists = (result: any) => {
    if (typeof result?.data === "boolean") return !result.data;
    const message = `${result?.message || result?.msg || ""}`.toLowerCase();
    if (message.includes("exist") || message.includes("已存在") || message.includes("已注冊")) {
      return true;
    }
    if (message.includes("not exist") || message.includes("available")) {
      return false;
    }
    return null;
  };

  const checkEmailExists = async (email: string) => {
    if (!email) return false;

    if (checkedEmail === email) {
      return emailExists;
    }

    setEmailChecking(true);
    try {
      const response = await fetch(
        `/go-tech/platform/platformCustomer/emailExistVerify?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      const exists = parseEmailExists(result);
      
      setCheckedEmail(email);

      if (exists === null) {
        setEmailExists(false);
        return false;
      }

      setEmailExists(exists);
      if (exists) {
        toast.error(EXISTING_EMAIL_MESSAGE);
      }
      return exists;
    } catch (err) {
      console.log(err);
      if (err instanceof Response) {
        sendToBetterStack("error", err.statusText, {
          uri: `/go-tech/platform/platformCustomer/checkEmail?email=${email}`,
          extra: await err.json(),
        });
      }
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  const handleEmailBlur = async () => {
    const result = verificationCodeSchema.safeParse({ email: formData.email });
    if (!result.success) return;
    await checkEmailExists(result.data.email);
  };

  const handleSendCode = async () => {
    // 倒计时中不允许再次发送
    if (countdown > 0 || pending) return;

    const result = verificationCodeSchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || "";
      toast.error(message);
      return;
    }

    if (emailExists) {
      toast.error(EXISTING_EMAIL_MESSAGE);
      return;
    }

    try {
      setPending(true);
      const response = await fetch(
        `/go-tech/platform/platformCustomer/sendCode?email=${formData.email}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (result && result.code && result.code === 200) {
        toast.success("驗證碼已發送至您的郵箱");
        setTargetDate(Date.now() + 60 * 1000);
        return;
      }
      toast.error(result.message);
    } catch (err) {
      console.log(err);
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, { uri: `/go-tech/platform/platformCustomer/sendCode?email=${formData.email}`, extra: await err.json() })
      }
      toast.error("驗證碼發送失敗，請稍後再試");
    } finally {
      setPending(false);
    }
  };

  const handlePrevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || "";
      toast.error(message);
      return;
    }

    const exists = await checkEmailExists(result.data.email);
    if (exists) {
      toast.error(EXISTING_EMAIL_MESSAGE);
      return;
    }

    try {
      setValidatedPending(true);

      const { name, email, phone, company, verificationCode } = result.data;

      const response = await fetch(
        "/go-tech/platform/platformCustomer/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            company,
            verificationCode,
          }),
        }
      );

      const validatedResult = await response.json();

      if (validatedResult.code !== 200) {
        toast.error(validatedResult.message);
        return;
      }
      setStep(1);
      setTargetDate(undefined);
    } catch (err) {
      console.log(err);
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, { uri: `/go-tech/platform/platformCustomer/verify`, extra: await err.json(), body: result.data })
      }
    } finally {
      setValidatedPending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) return;
    const result = signupSchema2.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || "";
      toast.error(message);
      return;
    }
    try {
      setSignupPending(true);
      const {
        name: custName,
        email,
        phone,
        company: companyName,
        password,
      } = result.data;

      const response = await fetch(
        "/go-tech/platform/platformCustomer/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            custName,
            email,
            phone,
            companyName,
            password,
          }),
        }
      );

      const signupResult = await response.json();
      if (signupResult.code !== 200) {
        toast.error(signupResult.message);
        return;
      }

      toast.promise(
        new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }),
        {
          loading: "注册成功, 正在為您跳转登录页面...",
          success: "跳轉成功, 請登入",
          duration: 1000,
          onAutoClose() {
            toast.dismiss();
            router.push("/account/login");
          },
        }
      );
    } catch (err) {
      console.log(err);
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, { uri: `/go-tech/platform/platformCustomer/register`, extra: await err.json(), body: result.data })
      }
    } finally {
      setSignupPending(false);
    }
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
          <Image
            src={Logo}
            alt="logo"
            className="w-40 h-auto"
            loading="eager"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">
          注册新帳戶
        </h1>

        <form
          onSubmit={step === 1 ? handleSubmit : handlePrevSubmit}
          className="space-y-4"
        >
          {step === 1 ? (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder="請輸入密碼"
                    value={formData.password}
                    onChange={handleChange("password")}
                    className="h-12 text-base border-border flex-1"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-5 flex items-center gap-1">
                  <CircleAlert className="w-3.5 h-3.5" />
                  密碼需至少包含一個字母、一個數字和一個特殊字符
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder="請再次輸入密碼"
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  className="h-12 text-base border-border flex-1"
                />
              </div>
              <Button
                type="submit"
                disabled={signupPending}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {signupPending ? "處理中..." : "註冊"}
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
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="請輸入您的電子郵箱"
                    value={formData.email}
                    onChange={handleChange("email")}
                    onBlur={handleEmailBlur}
                    className="h-12 text-base border-border pr-11"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailAvailable ? (
                      <svg key={checkedEmail} viewBox="0 0 24 24" className="h-5 w-5">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2"
                          strokeDasharray="57"
                          strokeDashoffset="57"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="57"
                            to="0"
                            dur="0.22s"
                            fill="freeze"
                          />
                        </circle>
                        <path
                          d="M8 12.5L10.8 15.3L16.5 9.8"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="24"
                          strokeDashoffset="24"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="24"
                            to="0"
                            begin="0.16s"
                            dur="0.2s"
                            fill="freeze"
                          />
                        </path>
                      </svg>
                    ) : null}
                  </span>
                </div>
              </div>
              {emailChecking ? (
                <p className="text-xs text-gray-400 ml-5 -mt-2">正在驗證郵箱...</p>
              ) : emailExists ? (
                <p className="text-xs text-destructive ml-5 -mt-2">{EXISTING_EMAIL_MESSAGE}</p>
              ) : null}

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
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  驗證碼
                </span>
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
                  disabled={isCodeButtonDisabled}
                  className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                >
                  {pending
                    ? "發送中..."
                    : countdown > 0
                      ? `${Math.ceil(countdown / 1000)}s 後重發`
                      : "發送驗證碼"}
                </Button>
              </div>

              <div className="flex items-center gap-2 py-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={checked =>
                    setAcceptTerms(checked as boolean)
                  }
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground"
                >
                  我已閱讀並同意
                  <a href="/legal-agreement/terms/terms-of-use" className="text-primary hover:underline">
                    《服務條款》
                  </a>
                  及
                  <a href="/legal-agreement/terms/privacy" className="text-primary hover:underline">
                    《私隱政策》
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={validatedPending}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {validatedPending ? "處理中..." : "下一步"}
              </Button>
            </>
          )}
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
