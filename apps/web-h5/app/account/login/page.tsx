'use client';

import { Button, Input, toast } from '@go-tech/web-ui';
import Image from 'next/image';
import { useState } from 'react';
import Link from '@/app/components/Link';

import { Eye, EyeOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import z from 'zod';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
// import Logo from "@/assets/Gotech_Logo.webp";
import authBgImg from '@/assets/background.webp';
import { useAuth } from '@/contexts/AuthContext';
import { sendToBetterStack } from '@/lib/betterstack-logger';
import { HttpError, httpFetch } from '@/lib/http-fetch';

const signinSchema = z.object({
  username: z.string(),
  password: z.string().min(6)
});

const Login = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const type = searchParams.get('type');
  const redirect = searchParams.get('redirect');

  const t = useTranslations('Account');
  const router = useProgressRouter();
  const { refetchTenants, setToken, setUser } = useAuth();
  const [account, setAccount] = useState(email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const result = signinSchema.safeParse({
      username: account,
      password
    });

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    setIsLoading(true);

    try {
      const uri = type === 'user' ? '/pms-admin/web-back/admin/accept' : '/go-tech/platform/platformCustomer/login';

      const body =
        type === 'user'
          ? {
              email: result.data.username,
              password: result.data.password
            }
          : result.data;

      const response = await httpFetch(uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const signResponse = await response.json();
      if (signResponse.code === 200) {
        fetch('/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify(signResponse.data)
        })
          .then(res => res.json())
          .then(res => {
            setToken(signResponse.data.token);
            setUser(res.data);
            refetchTenants(signResponse.data.token);
            toast.success(t('loginSuccess'));
            router.replace(redirect || '/select-account');
          });
      }
    } catch (error) {
      if (error instanceof HttpError) {
        sendToBetterStack('error', error.response.statusText, { extra: error.data, body: result.data });
        // httpFetch 已将服务端中文 message 翻译为当前语言
        toast.error(error.message || t('loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Login Card */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl p-8 md:p-12">
        {/* Close Button */}
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-6 h-6" />
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/Gotech_Logo.webp" width={160} height={160} alt="logo" className="w-40" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-8">{t('loginTitle')}</h1>

        <div className="space-y-6">
          <Input
            type="text"
            placeholder={t('accountPlaceholder')}
            value={account}
            onChange={e => setAccount(e.target.value)}
            classNames={{
              root: 'h-14 px-3 border-border',
              control: 'md:text-sm text-base text-foreground caret-foreground'
            }}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              classNames={{
                root: 'h-14 px-3 pr-12 border-border',
                control: 'md:text-sm text-base text-foreground caret-foreground'
              }}
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
            onClick={() => handleSubmit()}
            disabled={isLoading || !account || !password}
            className="w-full h-14 text-lg font-semibold bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
          >
            {isLoading ? t('loggingIn') : t('login')}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-6 text-sm">
          <div className="flex gap-6">
            <Link
              href="/account/forget-password"
              className="text-foreground underline hover:text-primary transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <Link href="/account/register" className="text-foreground underline hover:text-primary transition-colors">
            {t('registerNew')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 py-4">
        <div className="flex justify-center gap-8 text-sm text-background/80">
          <Link href="/legal-agreement/terms/terms-of-use" className="hover:text-background transition-colors">
            {t('termsOfService')}
          </Link>
          <Link href="/legal-agreement/terms/privacy" className="hover:text-background transition-colors">
            {t('privacyPolicy')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
