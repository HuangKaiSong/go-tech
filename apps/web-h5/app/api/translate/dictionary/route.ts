import { NextRequest, NextResponse } from 'next/server';
import { loadDB, updateDB } from '@/app/lib/translation/loader';
import { translationCache } from '@/app/lib/translation/cache';
import { hash } from '@/app/lib/translation/hash';
import type { TranslationEntry } from '@/app/lib/translation/types';
import z from 'zod';

// 查询参数校验（增加 value）
const GetQuerySchema = z.object({
  key: z.string().min(1, 'Key must not be empty').optional(),
  value: z.string().min(1, 'Value must not be empty').optional(),
});

/**
 * GET /api/translate/dictionary?key=xxx
 * 查询翻译词典
 * - 无参数：返回全部条目
 * - 有 key 参数：返回指定 key 的条目
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = GetQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { key, value } = result.data;

    const db = await loadDB(); // 使用带 mtime 缓存加载

    // 1. 精确 key 查询
    if (key) {
      const entry = db[key];
      if (!entry) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
      }
      return NextResponse.json({
        key,
        source: entry.source,
        translations: entry.translations,
      });
    }

    // 2. 按翻译值搜索
    if (value) {
      const searchTerm = value.trim().toLowerCase();
      const results: Array<{ key: string; source: string; translations: Record<string, string> }> = [];

      for (const [entryKey, entry] of Object.entries(db)) {
        const matched = Object.values(entry.translations).some((translated) =>
          translated.toLowerCase().includes(searchTerm)
        );
        if (matched) {
          results.push({
            key: entryKey,
            source: entry.source,
            translations: entry.translations,
          });
        }
      }

      if (results.length === 0) {
        return NextResponse.json({ error: 'No matches found' }, { status: 404 });
      }
      return NextResponse.json({ results });
    }

    // 3. 无参数：返回全部
    return NextResponse.json(db);
  } catch (error) {
    console.error('[Dictionary GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


const PostBodySchema = z
  .object({
    key: z.string().min(1, 'Key must not be empty').optional(),
    source: z.string().min(1, 'Source must not be empty').optional(),
    translations: z
      .record(z.string(), z.string().min(1, 'Translation value must not be empty'))
      .refine((obj) => Object.keys(obj).length > 0, {
        message: 'translations is required',
      }),
  })
  .refine((data) => data.key || data.source, {
    message: 'Either key or source must be provided',
    path: ['key'], // 错误会附加到 key 字段上
  });


/**
 * POST /api/translate/dictionary
 * 修改翻译条目
 * Body: { key?: string, source?: string, translations: Record<string, string> }
 * - key 和 source 至少提供一个，若提供 source 则计算 hash 作为 key
 * - translations 为目标语言的翻译映射，会合并到现有条目
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = PostBodySchema.safeParse(body);

    // 参数校验
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { key, source, translations } = result.data;

    // 确定要更新的 key
    let targetKey = key;
    if (!targetKey && source) {
      targetKey = hash(source);
    }
    if (!targetKey) {
      return NextResponse.json(
        { error: 'Either key or source must be provided' },
        { status: 400 }
      );
    }

    // 执行更新（原子操作，排队写入）
    await updateDB((db) => {
      if (!db[targetKey]) {
        // 如果条目不存在，需要从 source 或 key 推断源文本？这里要求必须存在或提供 source
        if (!source) {
          throw new Error('Cannot create new entry without source');
        }
        db[targetKey] = {
          source,
          translations: {} as TranslationEntry['translations'],
          updatedAt: Date.now(),
        };
      }
      // 合并 translations，覆盖已有语言
      const translationEntries = Object.entries(translations) as [keyof TranslationEntry['translations'], string][]
      for (const [locale, value] of translationEntries) {
        if (typeof value !== 'string') {
          throw new TypeError(`Translation value for ${String(locale)} must be a string`);
        }
        db[targetKey].translations[locale] = value;
      }
      db[targetKey].updatedAt = Date.now();
      return db;
    });

    // 更新成功，清除内存缓存（简单粗暴清空所有，确保旧值失效）
    translationCache.clear();

    // 重新读取最新数据返回
    const updatedDb = await loadDB();
    const entry = updatedDb[targetKey];
    return NextResponse.json({
      key: targetKey,
      source: entry.source,
      translations: entry.translations,
    });
  } catch (error: any) {
    console.error('[Dictionary POST] Error:', error);
    const msg = error.message || 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
