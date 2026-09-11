// lib/translation/loader.ts

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { clearCache } from './cache';
import type { PendingItem, TranslationDB } from './types';
import { enqueueWrite } from './write-queue';

const DB_PATH = path.join(process.cwd(), 'translations', 'dynamic.json');
const PENDING_PATH = path.join(process.cwd(), 'translations', 'pending.json');

// mtime 内存缓存（只读缓存，依然有效）
const cache = {
  mtime: 0,
  data: {} as TranslationDB
};

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

async function writeFileAtomically(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
}

/** 读取 dynamic.json（带 mtime 缓存，仅用于查询） */
export async function loadDB(): Promise<TranslationDB> {
  try {
    const stat = await fs.stat(DB_PATH);
    if (stat.mtimeMs === cache.mtime) {
      return cache.data;
    }

    // 🔄 文件已更新，清除内存缓存（因为无法精确知道哪些 key 受影响）
    clearCache();

    const content = await fs.readFile(DB_PATH, 'utf-8');
    const data = JSON.parse(content) as TranslationDB;
    cache.mtime = stat.mtimeMs;
    cache.data = data;
    return data;
  } catch (error: unknown) {
    if (isFileSystemError(error) && error.code === 'ENOENT') {
      return {};
    }
    console.error('Failed to load translation DB:', error);
    return {};
  }
}

/** 原子性更新 dynamic.json（排队执行） */
export function updateDB(updater: (data: TranslationDB) => TranslationDB): Promise<void> {
  return enqueueWrite(async () => {
    // 1. 从磁盘读取最新数据（避开内存缓存，防止读取到队列中之前还未落盘的旧状态）
    let content: string;
    try {
      content = await fs.readFile(DB_PATH, 'utf-8');
    } catch (error: unknown) {
      if (isFileSystemError(error) && error.code === 'ENOENT') {
        content = '{}';
      } else {
        throw error;
      }
    }

    const data = JSON.parse(content) as TranslationDB;
    const newData = updater(data);

    // 2. 原子写入（先写临时文件，再 rename）
    const json = JSON.stringify(newData, null, 2);
    await writeFileAtomically(DB_PATH, json);

    // 3. 更新内存缓存（mtime + data）
    const stat = await fs.stat(DB_PATH);
    cache.mtime = stat.mtimeMs;
    cache.data = newData;
  });
}

/** 添加待审核条目（排队执行） */
export function addPending(source: string): Promise<void> {
  return enqueueWrite(async () => {
    let list: PendingItem[] = [];
    try {
      const content = await fs.readFile(PENDING_PATH, 'utf-8');
      list = JSON.parse(content);
    } catch (error: unknown) {
      if (!isFileSystemError(error) || error.code !== 'ENOENT') {
        throw error;
      }
    }

    const existing = list.find(item => item.source === source);
    if (existing) {
      existing.count += 1;
    } else {
      list.push({ source, firstSeenAt: Date.now(), count: 1 });
    }

    await writeFileAtomically(PENDING_PATH, JSON.stringify(list, null, 2));
  });
}

/** 批量添加待审核条目（一次写文件） */
export function addPendingBatch(sources: string[]): Promise<void> {
  if (sources.length === 0) return Promise.resolve();

  return enqueueWrite(async () => {
    let list: PendingItem[] = [];
    try {
      const content = await fs.readFile(PENDING_PATH, 'utf-8');
      list = JSON.parse(content);
    } catch (error: unknown) {
      if (!isFileSystemError(error) || error.code !== 'ENOENT') throw error;
    }

    // 使用 Map 去重并累加 count
    const map = new Map<string, PendingItem>();
    for (const item of list) {
      map.set(item.source, item);
    }
    for (const source of sources) {
      const existing = map.get(source);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(source, { source, firstSeenAt: Date.now(), count: 1 });
      }
    }

    const newList = Array.from(map.values());
    await writeFileAtomically(PENDING_PATH, JSON.stringify(newList, null, 2));
  });
}
