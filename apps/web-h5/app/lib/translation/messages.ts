import { loadDB } from "./loader";
import type { Locale } from "./types";

/**
 * 从 dynamic.json 提取当前语言的「原文 → 译文」完整字典，
 * 供 RootLayout 注入 DynamicI18nProvider（序列化进 HTML）。
 * 注意：不加 'use server'，这是普通服务端工具函数。
 */
export async function getDynamicMessages(
  locale: Locale
): Promise<Record<string, string>> {
  const db = await loadDB(); // 内部有 mtime 缓存，非首次请求开销≈0
  const messages: Record<string, string> = {};

  for (const entry of Object.values(db)) {
    const translated = entry.translations?.[locale];
    // 仅接受字符串：历史上曾有 Promise 未 await 被序列化为 {} 写入库，truthy 检查拦不住
    if (entry.source && typeof translated === 'string') {
      messages[entry.source] = translated;
    }
  }

  return messages;
}
