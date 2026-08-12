'use client';

import { useCountDown } from '@go-tech/hooks';
import { Button, Input, toast } from '@go-tech/web-ui';
import { CircleAlert, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import z from 'zod';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import Link from '@/app/components/Link';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { translateError } from '@/app/lib/translate-error';
import authBgImg from '@/assets/background.webp';
import { sendToBetterStack } from '@/lib/betterstack-logger';
import { HttpError, httpFetch } from '@/lib/http-fetch';

const inputClassNames = {
  root: 'h-14 px-3 pr-12 border-border',
  control: 'md:text-sm text-base text-foreground caret-foreground'
};

const ForgetPassword = () => {
  const router = useProgressRouter();
  const [formData, setFormData] = useState({
    account: '',
    verificationCode: '',
    pwd: '',
    verifyPwd: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step, setStep] = useState(0);

  const locale = useLocale();

  const codeSentMsg = useBatchTranslation('驗證碼已發送至您的郵箱');
  const codeFailMsg = useBatchTranslation('驗證碼發送失敗，請稍後再試');
  const resetSuccessLoading = useBatchTranslation('重置密碼成功, 正在為您跳转登录页面...');
  const resetSuccessMsg = useBatchTranslation('跳轉成功, 請登入');
  const sendCodeText = useBatchTranslation('發送驗證碼');
  const sendingText = useBatchTranslation('發送中...');
  const retrySuffix = useBatchTranslation('後重發');
  const passwordPlaceholder = useBatchTranslation('請輸入密碼');
  const pwdConfirmPlaceholder = useBatchTranslation('請再次輸入密碼');
  const emailPlaceholder = useBatchTranslation('請輸入您的電子郵箱');
  const codePlaceholder = useBatchTranslation('請輸入收到的驗證碼');
  const processingText = useBatchTranslation('處理中...');
  const confirmResetText = useBatchTranslation('確認重置');
  const nextStepText = useBatchTranslation('下一步');
  const codeLabel = useBatchTranslation('驗證碼');

  // schema 校验消息
  const emailRequiredMsg = useBatchTranslation('請輸入邮箱');
  const emailInvalidMsg = useBatchTranslation('請輸入正確的郵箱');
  const verificationCodeRequired = useBatchTranslation('請輸入驗證碼');
  const passwordMinLengthMsg = useBatchTranslation('密码至少需要6位字符');
  const passwordPatternMsg = useBatchTranslation('密码需至少包含一个字母、一个数字和一个特殊字符');
  const passwordMismatchMsg = useBatchTranslation('密码不一致');

  const sendCodeSchema = z.object({
    account: z.string().min(1, emailRequiredMsg).email({ message: emailInvalidMsg }).trim()
  });

  const verificationCodeSchema = sendCodeSchema.extend({
    verificationCode: z.string().min(1, verificationCodeRequired)
  });

  const forgetPwdVerifySchema = verificationCodeSchema
    .extend({
      pwd: z
        .string()
        .min(6, passwordMinLengthMsg)
        .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/, passwordPatternMsg)
        .trim(),
      verifyPwd: z.string().trim()
    })
    .refine(data => data.pwd === data.verifyPwd, {
      message: passwordMismatchMsg,
      path: ['confirmPassword']
    });

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
      const message = result.error.message || '';
      toast.error(message);
      return;
    }

    try {
      setIsSendingCode(true);

      const response = await httpFetch(`/go-tech/platform/platformCustomer/sendCode?email=${formData.account}`, {
        method: 'POST'
      });
      const fetchResult = await response.json();

      if (fetchResult && fetchResult.code && fetchResult.code === 200) {
        toast.success(codeSentMsg);
        setTargetDate(Date.now() + 60 * 1000);
        return;
      }
      toast.error((await translateError(fetchResult.message, locale)) || fetchResult.message);
    } catch (err) {
      if (err instanceof HttpError) {
        sendToBetterStack('error', err.response.statusText, {
          uri: `/go-tech/platform/platformCustomer/sendCode?email=${formData.account}`,
          extra: err.data
        });
      }
      // HttpError 的 message 已被 httpFetch 翻译
      toast.error(err instanceof HttpError && err.message ? err.message : codeFailMsg);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handlePrevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = verificationCodeSchema.safeParse(formData);

    if (!result.success) {
      toast.error(result.error.message || '');
      return;
    }

    try {
      setIsLoading(true);
      const response = await httpFetch('/go-tech/platform/platformCustomer/forgetPwdVerify', {
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
        toast.error((await translateError(validatedResult.message, locale)) || validatedResult.message);
        return;
      }
      setStep(1);
      setTargetDate(undefined);
    } catch (error) {
      if (error instanceof HttpError) {
        sendToBetterStack('error', error.response.statusText, {
          uri: `/go-tech/platform/platformCustomer/forgetPwdVerify`,
          extra: error.data,
          body: result.data
        });
        // message 已被 httpFetch 翻译（此前由 code!==200 分支展示）
        toast.error(error.message);
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
      toast.error(result.error.message || '');
      return;
    }
    try {
      setIsLoading(true);

      const response = await httpFetch('/go-tech/platform/platformCustomer/resetPwd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: result.data.account,
          password: result.data.pwd
        })
      });

      const resetResult = await response.json();
      if (resetResult.code !== 200) {
        toast.error((await translateError(resetResult.message, locale)) || resetResult.message);
        return;
      }

      toast.promise(
        new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }),
        {
          loading: resetSuccessLoading,
          success: resetSuccessMsg,
          duration: 1000,
          onAutoClose() {
            toast.dismiss();
            router.push('/account/login');
          }
        }
      );
    } catch (err) {
      if (err instanceof HttpError) {
        sendToBetterStack('error', err.response.statusText, {
          uri: `/go-tech/platform/platformCustomer/resetPwd`,
          extra: err.data,
          body: result.data
        });
        // message 已被 httpFetch 翻译（此前由 code!==200 分支展示）
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  let sendCodeLabel = sendCodeText;
  if (isSendingCode) sendCodeLabel = sendingText;
  else if (countdown > 0) sendCodeLabel = `${Math.ceil(countdown / 1000)}s ${retrySuffix}`;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <Image src={authBgImg} alt="Background" loading="eager" fill className="absolute inset-0 h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      {/* Register Card */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl p-8 md:p-12 my-8 min-w-fit">
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

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">
          <DynamicText text="重置您的密碼" />
        </h1>

        <form onSubmit={step === 1 ? handleSubmit : handlePrevSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={passwordPlaceholder}
                  value={formData.pwd}
                  onChange={handleChange('pwd')}
                  classNames={inputClassNames}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-5 flex items-center gap-1">
                <CircleAlert className="w-3.5 h-3.5" />
                <DynamicText text="密碼至少需要6位字符，並至少包含一個字母、一個數字和一個特殊字符" />
              </p>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={pwdConfirmPlaceholder}
                  value={formData.verifyPwd}
                  onChange={handleChange('verifyPwd')}
                  classNames={inputClassNames}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? processingText : confirmResetText}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={emailPlaceholder}
                  value={formData.account}
                  onChange={handleChange('account')}
                  classNames={{
                    root: 'h-14 px-3 pr-12 border-border',
                    control: 'md:text-sm text-base text-foreground caret-foreground'
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{codeLabel}</span>
                <Input
                  type="text"
                  placeholder={codePlaceholder}
                  value={formData.verificationCode}
                  onChange={handleChange('verificationCode')}
                  classNames={{
                    root: 'h-14 px-3 pr-12 border-border',
                    control: 'md:text-sm text-base text-foreground caret-foreground'
                  }}
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
                {isLoading ? processingText : nextStepText}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
