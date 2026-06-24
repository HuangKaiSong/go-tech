'use client';

import { useCountDown } from '@go-tech-frontend/lib';
import { Button, Input, toast } from '@go-tech-frontend/ui';
import { CircleAlert, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import z from 'zod';
import Link from '@/app/components/Link';
// import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from '@/assets/background.webp';
import { sendToBetterStack } from '@/lib/betterstack-logger';

const sendCodeSchema = z.object({
  account: z.string().min(1, '請輸入邮箱').email({ message: '请输入正确的邮箱' }).trim()
});

const verificationCodeSchema = sendCodeSchema.extend({
  verificationCode: z.string().min(1, '請輸入驗證碼')
});

const forgetPwdVerifySchema = verificationCodeSchema
  .extend({
    pwd: z
      .string()
      .min(6, '密码至少需要6位字符')
      .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/, '密码需至少包含一个字母、一个数字和一个特殊字符')
      .trim(),
    verifyPwd: z.string().trim()
  })
  .refine(data => data.pwd === data.verifyPwd, {
    message: '密码不一致',
    path: ['confirmPassword']
  });

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    account: '',
    verificationCode: '',
    pwd: '',
    verifyPwd: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step, setStep] = useState(0);

  const [targetDate, setTargetDate] = useState<number>();

  const [countdown] = useCountDown({
    targetDate,
    onEnd() {
      setTargetDate(undefined);
    }
  });

  const isCodeButtonDisabled = isSendingCode || countdown > 0 || !formData.account;

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSendCode = async () => {
    // 倒计时中不允许再次发送
    if (countdown > 0 || isSendingCode) return;

    const result = sendCodeSchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || '';
      toast.error(message);
      return;
    }

    try {
      setIsSendingCode(true);

      const response = await fetch(`/go-tech/platform/platformCustomer/sendCode?email=${formData.account}`, {
        method: 'POST'
      });
      const fetchResult = await response.json();

      if (fetchResult && fetchResult.code && fetchResult.code === 200) {
        toast.success('驗證碼已發送至您的郵箱');
        setTargetDate(Date.now() + 60 * 1000);
        return;
      }
      toast.error(fetchResult.message);
    } catch (err) {
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, {
          uri: `/go-tech/platform/platformCustomer/sendCode?email=${formData.account}`,
          extra: await err.json()
        });
      }
      toast.error('驗證碼發送失敗，請稍後再試');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handlePrevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = verificationCodeSchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || '';
      toast.error(message);
      return;
    }

    try {
      const response = await fetch('/go-tech/platform/platformCustomer/forgetPwdVerify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.account,
          verificationCode: formData.verificationCode
        })
      });

      const validatedResult = await response.json();

      if (validatedResult.code !== 200) {
        toast.error(validatedResult.message);
        return;
      }
      setStep(1);
      setTargetDate(undefined);
    } catch (error) {
      if (error instanceof Response) {
        sendToBetterStack('error', error.statusText, {
          uri: `/go-tech/platform/platformCustomer/verify`,
          extra: await error.json(),
          body: result.data
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) return;

    const result = forgetPwdVerifySchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.errors.at(0)?.message || '';
      toast.error(message);
      return;
    }
    try {
      setIsLoading(true);

      const response = await fetch('/go-tech/platform/platformCustomer/resetPwd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: result.data.account,
          password: result.data.pwd
        })
      });

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
          loading: '重置密碼成功, 正在為您跳转登录页面...',
          success: '跳轉成功, 請登入',
          duration: 1000,
          onAutoClose() {
            toast.dismiss();
            router.push('/account/login');
          }
        }
      );
    } catch (err) {
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, {
          uri: `/go-tech/platform/platformCustomer/resetPwd`,
          extra: await err.json(),
          body: result.data
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  let sendCodeLabel = '發送驗證碼';
  if (isSendingCode) sendCodeLabel = '發送中...';
  else if (countdown > 0) sendCodeLabel = `${Math.ceil(countdown / 1000)}s 後重發`;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <Image
        src={authBgImg}
        alt="Background"
        loading="eager"
        style={{ width: 'auto' }}
        className="absolute inset-0 h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      {/* Register Card */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl p-8 md:p-12 my-8">
        {/* Close Button */}
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-6 h-6" />
        </Link>

        {/* Logo */}
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

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">重置您的密碼</h1>

        <form onSubmit={step === 1 ? handleSubmit : handlePrevSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder="請輸入密碼"
                  value={formData.pwd}
                  onChange={handleChange('pwd')}
                  className="h-12 text-base border-border flex-1"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-5 flex items-center gap-1">
                <CircleAlert className="w-3.5 h-3.5" />
                密碼需至少包含一個字母、一個數字和一個特殊字符
              </p>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder="請再次輸入密碼"
                  value={formData.verifyPwd}
                  onChange={handleChange('verifyPwd')}
                  className="h-12 text-base border-border flex-1"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '處理中...' : '確認重置'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder="請輸入您的電子郵箱"
                  value={formData.account}
                  onChange={handleChange('account')}
                  className="h-12 text-base border-border flex-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">驗證碼</span>
                <Input
                  type="text"
                  placeholder="請輸入收到的驗證碼"
                  value={formData.verificationCode}
                  onChange={handleChange('verificationCode')}
                  className="h-12 text-base border-border flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isCodeButtonDisabled}
                  className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                >
                  {sendCodeLabel}
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '處理中...' : '下一步'}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
