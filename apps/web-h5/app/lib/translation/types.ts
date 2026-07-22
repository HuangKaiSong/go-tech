export type Locale = 'en-us' | 'zh-cn' | 'zh-hk';


export interface TranslationEntry {
  source: string; // 原始中文
  translations: Record<Locale, string>; // { "en-us": "Hello", "zh-hk": "你好" }
  updatedAt: number; // 时间戳
  [k: string]: any
}

// 整个 dynamic.json 的结构
export type TranslationDB = Record<string, TranslationEntry>;

// 待审核条目（自动收集用）
export interface PendingItem {
  count: number;
  firstSeenAt: number;
  source: string;
}
