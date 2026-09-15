'use client';

import { toast } from '@go-tech/web-ui';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { translateError } from '@/app/lib/translate-error';
import { type ClientHttpErrorEvent, subscribeClientHttpErrors } from '@/lib/client-http/error-events';
import { getClientHttpErrorMessageKey } from '@/lib/client-http/error-message';

export function ClientHttpErrorNotifier() {
  const locale = useLocale();
  const t = useTranslations('RequestError');

  useEffect(() => {
    const showError = (event: ClientHttpErrorEvent) => {
      const messageKey = getClientHttpErrorMessageKey(event);
      let fallbackMessage: string;

      if (messageKey === 'business') {
        fallbackMessage = t(messageKey, { code: String(event.businessCode ?? '-') });
      } else if (messageKey === 'requestFailed') {
        fallbackMessage = t(messageKey, { status: String(event.status ?? '-') });
      } else {
        fallbackMessage = t(messageKey);
      }

      const initialMessage = event.userMessage || fallbackMessage;
      toast.error(initialMessage, { id: event.id });

      if (!event.userMessage) return;

      // 先显示后端原文保证即时反馈，再用同一个 toast 更新翻译结果。
      translateError(event.userMessage, locale)
        .then(message => {
          if (message && message !== initialMessage) toast.error(message, { id: event.id });
        })
        .catch(() => {
          // 翻译失败时保留已经显示的原文。
        });
    };

    return subscribeClientHttpErrors(showError);
  }, [locale, t]);

  return null;
}
