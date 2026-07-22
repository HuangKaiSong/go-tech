import type { Locale } from './types';
import { LRUCache } from "lru-cache";

export const memoryCache = new Map<string, string>();

export const pendingCache = new Map<string, Promise<string>>();

export function cacheKey(locale: Locale, text: string) {
  return `${locale}:${text}`;
}

export const translationCache = new LRUCache<string, string>({
  max: 5000, // 最多存储 5000 万条（可根据实际内存调整）
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 天自动过期（可取消）
  // 可选：监控缓存命中/淘汰
  // dispose: (value, key) => { console.log(`Evicting ${key}`); },
});

// Promise 去重缓存 —— 仅用于并发合并，请求完成后自动清除，不会持续占用
export const pendingPromises = new Map<string, Promise<string>>();

export function clearCache() {
  translationCache.clear();
  // 也可以清空 pendingPromises，因为语言变了，旧 promise 结果不再需要
  pendingPromises.clear();
}
