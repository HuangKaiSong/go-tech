import type { PostProcessorModule } from 'i18next';
import i18n from 'i18next';
import * as OpenCC from 'opencc-js';

/**
 * 簡體由繁體「原文 key」經 OpenCC 執行期轉換而來，不維護獨立的 zh-Hans 資源檔。 from:'t'(OpenCC 標準繁體) → to:'cn'(大陸簡體)：純字形轉換，不做詞彙替換（資訊→资讯，非「信息」），
 * 結果可預期。個別專有名詞若需微調，可在下方 OVERRIDES 加例外。
 */
const converter = OpenCC.Converter({ from: 't', to: 'cn' });

/** 轉換結果快取：每個唯一字串只轉一次，避免每次 t() 重複計算 */
const cache = new Map<string, string>();

/** 專有名詞/特例覆蓋（key 為繁體原文，value 為期望簡體）。預設為空，按需補充。 */
const OVERRIDES: Record<string, string> = {};

/** 繁體 → 簡體（帶快取 + 特例覆蓋） */
export function toSimplified(text: string): string {
  const hit = cache.get(text);
  if (hit !== undefined) return hit;
  const out = OVERRIDES[text] ?? converter(text);
  cache.set(text, out);
  return out;
}

/**
 * I18next 後處理器：僅在簡體語言下，把「已解析且已插值的值」轉為簡體；其餘語言原樣返回。 後處理器作用於「缺 key 回退值」之後、且在插值完成之後執行，故 zh-Hans 下的 {{...}} 佔位符
 * 已被替換為實際值，opencc 只轉字形（數字/連字元不受影響），插值與轉換兩者兼得。 語言直接讀 i18next 單例，避免依賴 process() 的 translator 參數在不同版本下的差異。
 */
export const openccPostProcessor: PostProcessorModule = {
  type: 'postProcessor',
  name: 'opencc',
  process(value: string) {
    if (i18n.language === 'zh-Hans' && typeof value === 'string') {
      return toSimplified(value);
    }
    return value;
  }
};
