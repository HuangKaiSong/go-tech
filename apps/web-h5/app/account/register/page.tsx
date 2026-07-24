'use client';

import { useCountDown } from '@go-tech/hooks';
import { Button, Checkbox, Input, toast } from '@go-tech/web-ui';
import { CircleAlert, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import z from 'zod';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import Link from '@/app/components/Link';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { translateError } from '@/app/lib/translate-error';
// import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from '@/assets/background.webp';
import { sendToBetterStack } from '@/lib/betterstack-logger';

const parseEmailExists = (result: any) => {
  if (typeof result?.data === 'boolean') return !result.data;
  const message = `${result?.message || result?.msg || ''}`.toLowerCase();
  if (message.includes('exist') || message.includes('已存在') || message.includes('已注冊')) {
    return true;
  }
  if (message.includes('not exist') || message.includes('available')) {
    return false;
  }
  return null;
};

const Register = () => {
  const router = useRouter();
  const t = useTranslations('Account');
  const locale = useLocale();
  const existingEmailMessage = t('emailExists');
  const passwordPlaceholder = useBatchTranslation('請輸入密碼');
  const pwdConfirmPlaceholder = useBatchTranslation('請再次輸入密碼');
  const namePlaceholder = useBatchTranslation('請輸入您的姓名');
  const emailPlaceholder = useBatchTranslation('請輸入您的電子郵箱');
  const phonePlaceholder = useBatchTranslation('請輸入您的聯繫電話');
  const companyPlaceholder = useBatchTranslation('請輸入您的公司名稱');
  const codePlaceholder = useBatchTranslation('請輸入郵箱收到的驗證碼');
  const codeSentMsg = useBatchTranslation('驗證碼已發送至您的郵箱');
  const codeFailMsg = useBatchTranslation('驗證碼發送失敗，請稍後再試');
  const regSuccessLoading = useBatchTranslation('注册成功, 正在為您跳转登录页面...');
  const regSuccessMsg = useBatchTranslation('跳轉成功, 請登入');
  const sendCodeText = useBatchTranslation('發送驗證碼');
  const sendingText = useBatchTranslation('發送中...');
  const retrySuffix = useBatchTranslation('後重發');
  const processingText = useBatchTranslation('處理中...');
  const registerText = useBatchTranslation('註冊');
  const nextStepText = useBatchTranslation('下一步');
  const loginText = useBatchTranslation('立即登入');
  const codeLabel = useBatchTranslation('驗證碼');
  const agreeText = useBatchTranslation('我已閱讀並同意');
  const termsText = useBatchTranslation('《服務條款》');
  const privacyText = useBatchTranslation('《私隱政策》');
  const haveAccountText = useBatchTranslation('已有帳戶？');
  const emailVerifyingText = useBatchTranslation('正在驗證郵箱...');

  const verificationCodeSchema = z.object({
    email: z
      .string()
      .min(1, t('vEmailRequired'))
      .email({ message: t('vEmailInvalid') })
      .trim()
  });
  const signupSchema = verificationCodeSchema.extend({
    name: z
      .string({ message: t('vNameRequired') })
      .min(2, t('vNameRequired'))
      .max(50)
      .trim(),
    phone: z
      .string({ message: t('vPhoneRequired') })
      .min(1, t('vPhoneRequired'))
      .min(7, t('vPhoneMin'))
      .trim(),
    company: z
      .string({ message: t('vCompanyRequired') })
      .min(2)
      .max(50)
      .trim(),
    verificationCode: z
      .string({ message: t('vCodeRequired') })
      .min(1, t('vCodeRequired'))
      .length(6)
      .trim()
  });
  const signupSchema2 = signupSchema
    .extend({
      password: z
        .string()
        .min(6, t('vPasswordMin'))
        .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/, t('passwordRule'))
        .trim(),
      confirmPassword: z.string().trim()
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('vPasswordMismatch'),
      path: ['confirmPassword']
    });

  const [targetDate, setTargetDate] = useState<number>();

  const [countdown] = useCountDown({
    targetDate,
    onEnd() {
      setTargetDate(undefined);
    }
  });

  const [pending, setPending] = useState(false);
  const [validatedPending, setValidatedPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    verificationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState(0);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'email') {
      setEmailExists(false);
      setCheckedEmail('');
    }
  };

  const isCodeButtonDisabled = pending || countdown > 0 || !formData.email || emailChecking || emailExists;
  const isEmailAvailable = Boolean(formData.email) && checkedEmail === formData.email && !emailChecking && !emailExists;

  const checkEmailExists = async (email: string) => {
    if (!email) return false;

    if (checkedEmail === email) {
      return emailExists;
    }

    setEmailChecking(true);
    try {
      const response = await fetch(
        `/go-tech/platform/platformCustomer/emailExistVerify?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
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
        toast.error(existingEmailMessage);
      }
      return exists;
    } catch (err) {
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, {
          uri: `/go-tech/platform/platformCustomer/checkEmail?email=${email}`,
          extra: await err.json()
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
      const message = result.error.message || '';
      toast.error(message);
      return;
    }

    if (emailExists) {
      toast.error(existingEmailMessage);
      return;
    }

    try {
      setPending(true);
      const response = await fetch(`/go-tech/platform/platformCustomer/sendCode?email=${formData.email}`, {
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
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, {
          uri: `/go-tech/platform/platformCustomer/sendCode?email=${formData.email}`,
          extra: await err.json()
        });
      }
      toast.error(codeFailMsg);
    } finally {
      setPending(false);
    }
  };

  const handlePrevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const message = result.error.message || '';
      toast.error(message);
      return;
    }

    const exists = await checkEmailExists(result.data.email);
    if (exists) {
      toast.error(existingEmailMessage);
      return;
    }

    try {
      setValidatedPending(true);

      const { company, email, name, phone, verificationCode } = result.data;

      const response = await fetch('/go-tech/platform/platformCustomer/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          verificationCode
        })
      });

      const validatedResult = await response.json();

      if (validatedResult.code !== 200) {
        toast.error((await translateError(validatedResult.message, locale)) || validatedResult.message);
        return;
      }
      setStep(1);
      setTargetDate(undefined);
    } catch (err) {
      if (err instanceof Response) {
        sendToBetterStack('error', err.statusText, {
          uri: `/go-tech/platform/platformCustomer/verify`,
          extra: await err.json(),
          body: result.data
        });
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
      const message = result.error.message || '';
      toast.error((await translateError(message, locale)) || message);
      return;
    }
    try {
      setSignupPending(true);
      const { company: companyName, email, name: custName, password, phone } = result.data;
      const type = new URLSearchParams(window.location.search).get('type') || undefined;

      const response = await fetch('/go-tech/platform/platformCustomer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custName,
          email,
          phone,
          companyName,
          password,
          type
        })
      });

      const signupResult = await response.json();
      if (signupResult.code !== 200) {
        toast.error((await translateError(signupResult.message, locale)) || signupResult.message);
        return;
      }

      toast.promise(
        new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }),
        {
          loading: regSuccessLoading,
          success: regSuccessMsg,
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
          uri: `/go-tech/platform/platformCustomer/register`,
          extra: await err.json(),
          body: result.data
        });
      }
    } finally {
      setSignupPending(false);
    }
  };

  let sendCodeLabel = sendCodeText;
  if (pending) sendCodeLabel = sendingText;
  else if (countdown > 0) sendCodeLabel = `${Math.ceil(countdown / 1000)}s ${retrySuffix}`;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <Image
        src={authBgImg}
        alt="Background"
        loading="eager"
        style={{ width: 'auto' }}
        className="absolute inset-0 w-full h-full object-cover"
      />
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
            width={160}
            height={160}
            loading="eager"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">
          <DynamicText text="注册新帳戶" />
        </h1>

        <form onSubmit={step === 1 ? handleSubmit : handlePrevSubmit} className="space-y-4 ">
          {step === 1 ? (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">*</span>
                  <Input
                    type="text"
                    placeholder={passwordPlaceholder}
                    value={formData.password}
                    onChange={handleChange('password')}
                    classNames={{
                      root: 'h-14 px-3 pr-12 border-border',
                      control: 'md:text-sm text-base text-foreground caret-foreground'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-5 flex items-center gap-1">
                  <CircleAlert className="w-3.5 h-3.5" />
                  <DynamicText text="密碼需至少包含一個字母、一個數字和一個特殊字符" />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={pwdConfirmPlaceholder}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  classNames={{
                    root: 'h-14 px-3 pr-12 border-border',
                    control: 'md:text-sm text-base text-foreground caret-foreground'
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={signupPending}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {signupPending ? processingText : registerText}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={namePlaceholder}
                  value={formData.name}
                  onChange={handleChange('name')}
                  classNames={{
                    root: 'h-14 px-3 pr-12 border-border',
                    control: 'md:text-sm text-base text-foreground caret-foreground'
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder={emailPlaceholder}
                    value={formData.email}
                    onChange={handleChange('email')}
                    onBlur={handleEmailBlur}
                    classNames={{
                      root: 'h-14 px-3 pr-12 border-border',
                      control: 'md:text-sm text-base text-foreground caret-foreground'
                    }}
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
                          <animate attributeName="stroke-dashoffset" from="57" to="0" dur="0.22s" fill="freeze" />
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
              {emailChecking && <p className="text-xs text-gray-400 ml-5 -mt-2">{emailVerifyingText}</p>}
              {!emailChecking && emailExists && (
                <p className="text-xs text-destructive ml-5 -mt-2">{existingEmailMessage}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="tel"
                  placeholder={phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  classNames={{
                    root: 'h-14 px-3 pr-12 border-border',
                    control: 'md:text-sm text-base text-foreground caret-foreground'
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-destructive">*</span>
                <Input
                  type="text"
                  placeholder={companyPlaceholder}
                  value={formData.company}
                  onChange={handleChange('company')}
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

              <div className="flex items-center gap-2 py-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={checked => setAcceptTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {agreeText}
                  <Link href="/legal-agreement/terms/terms-of-use" className="text-primary hover:underline">
                    {termsText}
                  </Link>
                  <DynamicText text="及" />
                  <Link href="/legal-agreement/terms/privacy" className="text-primary hover:underline">
                    {privacyText}
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={validatedPending}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {validatedPending ? processingText : nextStepText}
              </Button>
            </>
          )}
        </form>

        <div className="text-center mt-4 text-sm">
          <span className="text-muted-foreground">{haveAccountText}</span>{' '}
          <Link href="/account/login" className="text-primary hover:underline">
            {loginText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
