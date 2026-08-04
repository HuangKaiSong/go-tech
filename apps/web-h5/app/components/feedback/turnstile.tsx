'use client';

import { Button, Input } from '@go-tech-frontend/ui';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';

interface TurnstileApi {
  remove: (widgetId: string) => void;
  render: (
    container: HTMLElement,
    options: {
      action: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
      language: 'en' | 'zh-cn' | 'zh-tw';
      sitekey: string;
      size: 'flexible';
      theme: 'light';
    }
  ) => string;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  action: 'feedback_comment' | 'feedback_post';
  onVerify: (token: string) => void;
  resetKey: number;
}

interface CaptchaResponse {
  data?: { image: string; token: string };
}

const testSiteKey = '1x00000000000000000000AA';
const turnstileLanguages = {
  'en-us': 'en',
  'zh-cn': 'zh-cn',
  'zh-hk': 'zh-tw'
} as const;

const FallbackCaptcha = ({ action, onVerify, resetKey }: Props) => {
  const fallbackCaptchaLabel = useBatchTranslation('備用驗證碼');
  const [answer, setAnswer] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [error, setError] = useState(false);
  const [image, setImage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setAnswer('');
    setChallengeToken('');
    setError(false);
    setImage('');
    onVerify('');

    fetch(`/api/feedback/captcha?action=${action}`, { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Captcha request failed');
        return response.json() as Promise<CaptchaResponse>;
      })
      .then(result => {
        if (!result.data) throw new Error('Captcha response is invalid');
        setChallengeToken(result.data.token);
        setImage(result.data.image);
      })
      .catch(requestError => {
        if ((requestError as Error).name !== 'AbortError') setError(true);
      });

    return () => controller.abort();
  }, [action, onVerify, refreshKey, resetKey]);

  const changeAnswer = (value: string) => {
    const nextAnswer = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setAnswer(nextAnswer);
    onVerify(challengeToken && nextAnswer ? `fallback:${challengeToken}:${nextAnswer}` : '');
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 text-xs text-red-600">
        <DynamicText text="備用驗證載入失敗。" />
        <button type="button" className="underline" onClick={() => setRefreshKey(key => key + 1)}>
          <DynamicText text="重試" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-500">
        <DynamicText text="請輸入圖片中的驗證碼" />
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {image ? (
          <Image
            src={image}
            alt={fallbackCaptchaLabel}
            width={190}
            height={60}
            className="rounded-md border border-stone-200"
            unoptimized
          />
        ) : (
          <div className="h-[60px] w-[190px] animate-pulse rounded-md bg-stone-100" />
        )}
        <Input
          aria-label={fallbackCaptchaLabel}
          autoComplete="off"
          className="w-32 bg-white uppercase"
          maxLength={5}
          value={answer}
          onChange={event => changeAnswer(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={() => setRefreshKey(key => key + 1)}>
          <DynamicText text="換一張" />
        </Button>
      </div>
    </div>
  );
};

const TurnstileWidget = ({ action, language, onVerify, resetKey }: Props & { language: 'en' | 'zh-cn' | 'zh-tw' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.NODE_ENV === 'development' ? testSiteKey : '');

  const renderWidget = () => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

    setScriptReady(true);
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      action,
      callback: token => {
        setTurnstileVerified(true);
        onVerify(token);
      },
      'error-callback': () => setFallbackMode(true),
      'expired-callback': () => {
        setTurnstileVerified(false);
        onVerify('');
      },
      language,
      sitekey: siteKey,
      size: 'flexible',
      theme: 'light'
    });
  };

  const useFallback = () => {
    if (turnstileVerified) return;
    const widgetId = widgetIdRef.current;
    if (widgetId) window.turnstile?.remove(widgetId);
    widgetIdRef.current = null;
    setFallbackMode(true);
    onVerify('');
  };

  useEffect(() => {
    if (!siteKey || scriptReady || fallbackMode) return;
    const timeout = window.setTimeout(() => {
      const widgetId = widgetIdRef.current;
      if (widgetId) window.turnstile?.remove(widgetId);
      widgetIdRef.current = null;
      setFallbackMode(true);
      onVerify('');
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [fallbackMode, onVerify, scriptReady, siteKey]);

  useEffect(() => {
    const widgetId = widgetIdRef.current;
    if (widgetId) {
      window.turnstile?.reset(widgetId);
      setTurnstileVerified(false);
      onVerify('');
    }
  }, [onVerify, resetKey]);

  useEffect(
    () => () => {
      const widgetId = widgetIdRef.current;
      if (widgetId) window.turnstile?.remove(widgetId);
      widgetIdRef.current = null;
    },
    []
  );

  if (!siteKey || fallbackMode) {
    return <FallbackCaptcha action={action} onVerify={onVerify} resetKey={resetKey} />;
  }

  return (
    <>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
        onError={useFallback}
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      {!turnstileVerified && (
        <button type="button" className="text-xs text-stone-500 underline" onClick={useFallback}>
          <DynamicText text="驗證載入緩慢？使用備用驗證" />
        </button>
      )}
    </>
  );
};

const Turnstile = (props: Props) => {
  const locale = useLocale();
  const language = turnstileLanguages[locale as keyof typeof turnstileLanguages] || 'en';

  return <TurnstileWidget key={language} {...props} language={language} />;
};

export default Turnstile;
