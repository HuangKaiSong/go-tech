import _ from 'server-only';
import { type BotVerificationAction, verifyFallbackCaptcha } from './fallback-captcha';

interface SiteverifyResponse {
  action?: string;
  success: boolean;
}

const testSecretKey = '1x0000000000000000000000000000000AA';

const verifyTurnstileToken = async (token: string, expectedAction: BotVerificationAction) => {
  if (!token || token.length > 2048) return false;

  const secretKey = process.env.TURNSTILE_SECRET_KEY || (process.env.NODE_ENV === 'development' ? testSecretKey : '');
  if (!secretKey) return false;
  const isTestKey = secretKey === testSecretKey;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: JSON.stringify({ response: token, secret: secretKey }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;

    const result = (await response.json()) as SiteverifyResponse;
    return result.success && (isTestKey || result.action === expectedAction);
  } catch {
    return false;
  }
};

export const verifyBotToken = async (token: string, expectedAction: BotVerificationAction) => {
  if (!token.startsWith('fallback:')) return verifyTurnstileToken(token, expectedAction);

  const separatorIndex = token.lastIndexOf(':');
  if (separatorIndex <= 'fallback:'.length) return false;

  const challengeToken = token.slice('fallback:'.length, separatorIndex);
  const answer = token.slice(separatorIndex + 1);
  return verifyFallbackCaptcha(challengeToken, answer, expectedAction);
};
