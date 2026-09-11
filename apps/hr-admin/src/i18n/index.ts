import i18n, { changeLanguage, use } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { openccPostProcessor } from './opencc';

/** 支援語言：繁體（源語言）/ 簡體（OpenCC 由繁體轉出）/ English */
export const LOCALES = [
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' }
] as const;

export type LocaleValue = (typeof LOCALES)[number]['value'];

const STORAGE_KEY = 'hr_lang';
const SUPPORTED: LocaleValue[] = ['zh-Hant', 'zh-Hans', 'en'];

/** 讀取緩存語言；無效/首訪回退繁體 */
function detectInitialLang(): LocaleValue {
  const saved = localStorage.getItem(STORAGE_KEY) as LocaleValue | null;
  return saved && SUPPORTED.includes(saved) ? saved : 'zh-Hant';
}

use(openccPostProcessor)
  .use(initReactI18next)
  .init({
    lng: detectInitialLang(),
    fallbackLng: 'zh-Hant',
    // 繁體原文即 key：zh-Hant / zh-Hans 皆無資源檔，t() 回退為 key 本身並照常插值；
    // 簡體再由 opencc 後處理器把（已插值的）值轉為簡體；en 查表。
    resources: { en: { translation: en } },
    // key 為含中文標點/空格的自然語言原文，必須關閉分隔符，否則會被誤拆成巢狀結構。
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    // 全域啟用 opencc 後處理器（僅在 zh-Hans 下實際轉換）。作用於插值之後，故 {{...}} 已被替換，
    // 繁體/簡體的插值都能正常工作（修復先前 parseMissingKeyHandler 不插值的問題）。
    postProcess: ['opencc']
  });

/** 切換語言並持久化 */
export function setLang(lng: LocaleValue) {
  localStorage.setItem(STORAGE_KEY, lng);
  changeLanguage(lng);
}

export default i18n;
