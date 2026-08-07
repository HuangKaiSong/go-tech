'use server';
import { cacheKey, pendingPromises, translationCache } from './cache';
import { hash } from './hash';
import { addPending, addPendingBatch, loadDB, updateDB } from './loader';
import { translateBatchByAI, translateByAI } from './translator';
import type { Locale, TranslationEntry } from './types';

export async function translate(text: string, locale: Locale): Promise<string> {
  if (!text) return text;

  const key = hash(text);
  const memoryKey = cacheKey(locale, text);

  // 1. 内存强缓存
  if (translationCache.has(memoryKey)) {
    return translationCache.get(memoryKey)!;
  }

  // 2. Promise 去重（并发复用）
  if (pendingPromises.has(memoryKey)) {
    return await pendingPromises.get(memoryKey)!;
  }

  // 3. 创建翻译任务
  const task = (async () => {
    try {
      // 3.1 二次检查内存缓存（防止刚被其它任务写入）
      if (translationCache.has(memoryKey)) {
        return translationCache.get(memoryKey)!;
      }

      // 3.2 查询 dynamic.json（mtime 缓存）
      const db = await loadDB();
      if (db[key]?.translations[locale]) {
        const result = db[key].translations[locale];
        translationCache.set(memoryKey, result);
        return result;
      }

      // 3.3 调用 AI 翻译
      const translated = await translateByAI(text, locale);

      // 3.4 原子性写入（排队执行，保证不覆盖其它并发写入）
      await updateDB(currentDb => {
        if (!currentDb[key]) {
          currentDb[key] = {
            source: text,
            translations: {} as Record<Locale, string>,
            updatedAt: Date.now()
          };
        }
        currentDb[key].translations[locale] = translated;
        currentDb[key].updatedAt = Date.now();
        return currentDb;
      });

      // 3.5 更新内存缓存
      translationCache.set(memoryKey, translated);

      // 3.6 自动收集待审核（排队执行）
      await addPending(text);

      return translated;
    } catch (error) {
      console.error(`[Translation Error] "${text}" -> ${locale}`, error);
      return text; // 降级返回原文
    }
  })();

  // 存入 pending 去重 Map
  pendingPromises.set(memoryKey, task);

  try {
    return await task;
  } finally {
    pendingPromises.delete(memoryKey);
  }
}

/** 批量翻译（合并多个文本，一次 AI 调用） */
export async function translateBatch(texts: string[], locale: Locale): Promise<Record<string, string>> {
  if (texts.length === 0) return {};

  const result: Record<string, string> = {};
  const uncachedTexts: string[] = [];
  const entriesToUpdate: { entry: TranslationEntry; key: string }[] = [];

  // 1. 逐个检查缓存（内存 + 文件）
  for (const text of texts) {
    const key = hash(text);
    const memoryKey = cacheKey(locale, text);

    // 内存缓存
    if (translationCache.has(memoryKey)) {
      result[text] = translationCache.get(memoryKey)!;
      // oxlint-disable-next-line no-continue
      continue;
    }

    // 文件缓存（使用 loadDB，内部有 mtime 缓存）
    // oxlint-disable-next-line no-await-in-loop
    const db = await loadDB();
    if (db[key]?.translations[locale]) {
      const val = db[key].translations[locale];
      result[text] = val;
      translationCache.set(memoryKey, val);
      // oxlint-disable-next-line no-continue
      continue;
    }

    // 未缓存，加入待翻译列表
    uncachedTexts.push(text);
  }

  if (uncachedTexts.length === 0) {
    return result;
  }

  // 2. 调用批量 AI 翻译
  let batchResult: Record<string, string>;
  try {
    batchResult = await translateBatchByAI(uncachedTexts, locale);
  } catch (error) {
    console.error(`[Batch Translation Error] ${uncachedTexts.length} texts -> ${locale}`, error);
    return Object.fromEntries(texts.map(text => [text, result[text] ?? text]));
  }

  // 3. 准备更新缓存和文件
  for (const text of uncachedTexts) {
    const translated = batchResult[text];
    if (translated) {
      const key = hash(text);
      const memoryKey = cacheKey(locale, text);
      result[text] = translated;
      translationCache.set(memoryKey, translated);
      // 收集要写入文件的条目
      entriesToUpdate.push({
        key,
        entry: {
          source: text,
          translations: { [locale]: translated } as Record<Locale, string>,
          updatedAt: Date.now()
        }
      });
    } else {
      // 降级：返回原文
      result[text] = text;
    }
  }

  // 4. 批量写入 dynamic.json（一次原子写入）
  if (entriesToUpdate.length > 0) {
    try {
      await updateDB(db => {
        for (const { entry, key } of entriesToUpdate) {
          if (!db[key]) {
            db[key] = {
              source: entry.source,
              translations: {} as Record<Locale, string>,
              updatedAt: entry.updatedAt
            };
          }
          db[key].translations[locale] = entry.translations[locale];
          db[key].updatedAt = entry.updatedAt;
        }
        return db;
      });
    } catch (error) {
      console.error(`[Translation DB Write Error] ${entriesToUpdate.length} entries`, error);
    }
  }

  // 5. 批量添加待审核（一次写 pending.json）
  try {
    await addPendingBatch(uncachedTexts);
  } catch (error) {
    console.error(`[Pending Translation Write Error] ${uncachedTexts.length} entries`, error);
  }

  return result;
}
