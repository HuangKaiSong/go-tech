import _ from 'server-only';
import { type BotVerificationAction, verifyFallbackCaptcha } from './fallback-captcha';
import { classifyTurnstileFailure } from './turnstile-policy';

interface SiteverifyResponse {
  action?: string;
  'error-codes'?: string[];
  success: boolean;
}

export type BotVerificationResult = { success: true } | { reason: 'invalid' | 'unavailable'; success: false };

const testSecretKey = '1x0000000000000000000000000000000AA';

const verifyTurnstileToken = async (
  token: string,
  expectedAction: BotVerificationAction
): Promise<BotVerificationResult> => {
  if (!token || token.length > 2048) return { reason: 'invalid', success: false };

  const secretKey = process.env.TURNSTILE_SECRET_KEY || (process.env.NODE_ENV === 'development' ? testSecretKey : '');
  if (!secretKey) return { reason: 'unavailable', success: false };
  const isTestKey = secretKey === testSecretKey;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: JSON.stringify({ response: token, secret: secretKey }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return { reason: 'unavailable', success: false };

    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      console.warn('Turnstile verification rejected:', {
        errorCodes,
        expectedAction
      });
      return { reason: classifyTurnstileFailure(errorCodes), success: false };
    }
    if (!isTestKey && result.action !== expectedAction) {
      console.warn('Turnstile action mismatch:', { actualAction: result.action, expectedAction });
      return { reason: 'invalid', success: false };
    }
    return { success: true };
  } catch (error) {
    console.error('Turnstile verification request failed:', error);
    return { reason: 'unavailable', success: false };
  }
};

export const verifyBotToken = async (
  token: string,
  expectedAction: BotVerificationAction
): Promise<BotVerificationResult> => {
  if (!token.startsWith('fallback:')) return verifyTurnstileToken(token, expectedAction);

  const separatorIndex = token.lastIndexOf(':');
  if (separatorIndex <= 'fallback:'.length) return { reason: 'invalid', success: false };

  const challengeToken = token.slice('fallback:'.length, separatorIndex);
  const answer = token.slice(separatorIndex + 1);
  try {
    return (await verifyFallbackCaptcha(challengeToken, answer, expectedAction))
      ? { success: true }
      : { reason: 'invalid', success: false };
  } catch (error) {
    console.error('Fallback captcha verification failed:', error);
    return { reason: 'unavailable', success: false };
  }
};
