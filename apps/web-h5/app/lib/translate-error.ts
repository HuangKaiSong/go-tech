'use server';

import { translateBatch } from './translation';

/**
 * 翻译服务端错误信息（服务端始终返回中文，需按当前语言翻译）。 可在任意 async 上下文中调用，无需 hook。 内部复用 translateBatch 的缓存 / OpenCC / DeepL 全链路。
 *
 * @example
 *   const translated = await translateError(err.message, locale);
 *   toast.error(translated || t('loginFailed'));
 */
export async function translateError(text: string, locale: string): Promise<string> {
  if (!text) return text;
  const result = await translateBatch([text], locale as Locale);
  return result[text] || text;
}

type Locale = 'en-us' | 'zh-cn' | 'zh-hk';
