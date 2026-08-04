import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import _ from 'server-only';

export type BotVerificationAction = 'feedback_comment' | 'feedback_post';

interface CaptchaPayload {
  action: BotVerificationAction;
  expiresAt: number;
  nonce: string;
  signature: string;
}

interface CaptchaSignatureInput {
  action: BotVerificationAction;
  answer: string;
  expiresAt: number;
  nonce: string;
}

const captchaCookie = 'GO_TECH_FEEDBACK_CAPTCHA';
const captchaLifetime = 5 * 60 * 1000;
const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const getSecret = () => process.env.SESSION_SECRET || '';

const signCaptcha = ({ action, answer, expiresAt, nonce }: CaptchaSignatureInput) =>
  createHmac('sha256', getSecret()).update(`${nonce}:${answer}:${expiresAt}:${action}`).digest('hex');

const createCode = () => Array.from({ length: 5 }, () => characters[randomInt(0, characters.length)]).join('');

const createSvg = (code: string) => {
  const letters = [...code]
    .map((letter, index) => {
      const x = 22 + index * 31;
      const y = 42 + randomInt(-5, 6);
      const rotation = randomInt(-16, 17);
      return `<text x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})">${letter}</text>`;
    })
    .join('');
  const lines = Array.from({ length: 5 }, () => {
    const color = `hsl(${randomInt(0, 360)} 35% 55%)`;
    return `<line x1="${randomInt(0, 190)}" y1="${randomInt(0, 60)}" x2="${randomInt(0, 190)}" y2="${randomInt(0, 60)}" stroke="${color}" stroke-width="1"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="60" viewBox="0 0 190 60"><rect width="190" height="60" rx="6" fill="#f5f5f4"/>${lines}<g fill="#1c1917" font-family="monospace" font-size="30" font-weight="700">${letters}</g></svg>`;
};

export const createFallbackCaptcha = async (action: BotVerificationAction) => {
  if (!getSecret()) return null;

  const answer = createCode();
  const expiresAt = Date.now() + captchaLifetime;
  const nonce = randomBytes(16).toString('hex');
  const payload: CaptchaPayload = {
    action,
    expiresAt,
    nonce,
    signature: signCaptcha({ action, answer, expiresAt, nonce })
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const image = `data:image/svg+xml;base64,${Buffer.from(createSvg(answer)).toString('base64')}`;

  const cookieStore = await cookies();
  cookieStore.set(captchaCookie, nonce, {
    httpOnly: true,
    maxAge: captchaLifetime / 1000,
    path: '/api/feedback',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  return { image, token };
};

export const verifyFallbackCaptcha = async (token: string, answer: string, expectedAction: BotVerificationAction) => {
  const cookieStore = await cookies();
  const captchaNonce = cookieStore.get(captchaCookie)?.value;
  cookieStore.delete(captchaCookie);
  if (!captchaNonce || !token || !answer || !getSecret()) return false;

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString()) as Partial<CaptchaPayload>;
    if (
      payload.action !== expectedAction ||
      payload.nonce !== captchaNonce ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt < Date.now() ||
      typeof payload.signature !== 'string'
    ) {
      return false;
    }

    const expectedSignature = signCaptcha({
      action: expectedAction,
      answer: answer.trim().toUpperCase(),
      expiresAt: payload.expiresAt,
      nonce: payload.nonce
    });
    const actualBuffer = Buffer.from(payload.signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
};
