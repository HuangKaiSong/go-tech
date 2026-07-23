import * as deepl from 'deepl-node';
import * as OpenCC from 'opencc-js';

export type TranslationProvider = 'alibaba' | 'deepl' | 'google' | 'openai';

// 默认 Provider（可通过环境变量覆盖）
const DEFAULT_PROVIDER: TranslationProvider = (process.env.TRANSLATION_PROVIDER as TranslationProvider) || 'deepl';

function detectScript(text: string) {
  // 1. 创建转换器：尝试将文本当作繁体转换为简体
  const converter = OpenCC.Converter({ from: 't', to: 'cn' });
  const converted = converter(text);

  // 2. 如果转换后的文本和原文不同，说明原文包含繁体字
  if (converted !== text) {
    return 'hk';
  }

  // 3. 如果相同，再尝试反向转换：将文本当作简体转换为繁体
  const reverseConverter = OpenCC.Converter({ from: 'cn', to: 't' });
  const reverseConverted = reverseConverter(text);

  // 4. 如果反向转换后文本变了，说明原文包含简体字
  if (reverseConverted !== text) {
    return 'cn';
  }

  // 5. 如果双向转换都没有变化，说明文本可能不包含中文字符，或仅包含简繁共用字
  return 'unknown';
}

export function translateWithOpenCC(text: string, locale: string): string {
  const sourceLang = detectScript(text);
  if (sourceLang === 'unknown') {
    return text;
  }
  const targetlang = locale === 'zh-cn' ? 'cn' : 'hk';

  const converter = OpenCC.Converter({ from: sourceLang, to: targetlang });

  return converter(text);
}

/**
 * 核心翻译函数：发送翻译请求给 AI（支持单条或批量）
 *
 * @param texts - 待翻译的文本数组（去重后传入）
 * @param locale - 目标语言
 * @param provider - 翻译提供商（可选）
 * @returns 映射：原始文本 → 翻译结果
 */
async function callAITranslation(
  texts: string[],
  locale: string,
  provider: TranslationProvider = DEFAULT_PROVIDER
): Promise<Record<string, string>> {
  if (texts.length === 0) return {};

  // 如果目标语言是中文变体，使用 OpenCC
  if (locale === 'zh-cn' || locale === 'zh-hk') {
    // 假设源语言是中文（简/繁）
    const result: Record<string, string> = {};
    for (const text of texts) {
      result[text] = translateWithOpenCC(text, locale);
    }
    return result;
  }

  switch (provider) {
    case 'openai':
      return translateWithOpenAI(texts, locale);
    case 'deepl':
      return translateWithDeepL(texts, locale);
    case 'alibaba':
      return translateWithAlibaba(texts, locale);
    case 'google':
      return translateWithGoogle(texts, locale);
    default:
      throw new Error(`Unsupported translation provider: ${provider}`);
  }
}

// ---------- Provider 实现（各自支持批量） ----------

async function translateWithOpenAI(texts: string[], locale: string): Promise<Record<string, string>> {
  // 示例：调用 OpenAI Chat Completion，一次请求翻译多条
  // const response = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   messages: texts.map(text => ({
  //     role: "user",
  //     content: `Translate the following text to ${locale}: "${text}"`
  //   })),
  // });
  // const translations = response.choices.map(choice => choice.message.content);
  // return Object.fromEntries(texts.map((text, i) => [text, translations[i]]));

  // 占位实现（模拟）
  console.log(`[OpenAI] Translating ${texts.length} texts to ${locale}`);
  // oxlint-disable-next-line no-promise-executor-return
  await new Promise(resolve => setTimeout(resolve, 300));
  const result: Record<string, string> = {};
  for (const text of texts) {
    result[text] = `[${locale}] ${text}`;
  }
  return result;
}

export async function translateWithDeepL(texts: string[], locale: string): Promise<Record<string, string>> {
  const authKey = process.env.DEEPL_API_KEY || '';

  const deeplClient = new deepl.DeepLClient(authKey);

  let targetLang: deepl.TargetLanguageCode;
  let instruction;

  if (locale === 'zh-cn') {
    targetLang = 'zh-HANS';
    instruction = 'Translate into Simplified Chinese';
  } else if (locale === 'zh-hk') {
    targetLang = 'zh-HANT';
    instruction = 'Translate into Traditional Chinese';
  } else {
    targetLang = 'en-US';
    instruction = 'Translate into American English';
  }

  // DeepL 支持批量文本（作为数组传入）
  const response: deepl.TextResult[] = await deeplClient.translateText(texts, null, targetLang, {
    preserveFormatting: false,
    customInstructions: [instruction]
  });

  return Object.fromEntries(texts.map((text, i) => [text, response[i].text]));
}

async function translateWithAlibaba(texts: string[], locale: string): Promise<Record<string, string>> {
  // 阿里云翻译支持批量（多个文本用换行符分隔）
  // const response = await alibaba.translate(texts.join('\n'), { target: locale });
  // const translations = response.translatedText.split('\n');
  // return Object.fromEntries(texts.map((text, i) => [text, translations[i]]));

  console.log(`[Alibaba] Translating ${texts.length} texts to ${locale}`);
  // oxlint-disable-next-line no-promise-executor-return
  await new Promise(resolve => setTimeout(resolve, 300));
  const result: Record<string, string> = {};
  for (const text of texts) {
    result[text] = `[${locale}] ${text}`;
  }
  return result;
}

async function translateWithGoogle(texts: string[], locale: string): Promise<Record<string, string>> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';

  let targetLang: string;
  if (locale === 'zh-cn') {
    targetLang = 'zh-CN';
  } else if (locale === 'zh-hk') {
    targetLang = 'zh-TW';
  } else {
    targetLang = 'en';
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, target: targetLang, format: 'text' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Translate API error: ${response.status} ${errorText}`);
  }

  const data = await response.json() as {
    data: { translations: { translatedText: string }[] };
  };

  return Object.fromEntries(
    texts.map((text, i) => [text, data.data.translations[i].translatedText])
  );
}

// ---------- 对外公开的单条和批量接口 ----------

/** 单条翻译（兼容旧接口） */
export async function translateByAI(text: string, locale: string): Promise<string> {
  const result = await callAITranslation([text], locale);
  return result[text] || text;
}

/** 批量翻译（对外公开） */
export async function translateBatchByAI(texts: string[], locale: string): Promise<Record<string, string>> {
  // 去重（避免重复翻译）
  const unique = Array.from(new Set(texts));
  const result = await callAITranslation(unique, locale);
  // 如果传入的 texts 有重复，这里确保每个都返回
  return Object.fromEntries(texts.map(text => [text, result[text] || text]));
}
