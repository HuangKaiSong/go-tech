import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPageBlockDirectory, initializePageBlockDirectory } from './page-block-directory.cjs';

const initializedDirectories = new Set<string>();

export const isValidPageBlockKey = (page: unknown): page is string =>
  typeof page === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page);

const getPageBlockPath = (page: string) => {
  if (!isValidPageBlockKey(page)) throw new Error('Invalid page block key');
  const directory = getPageBlockDirectory();
  if (!initializedDirectories.has(directory)) {
    initializePageBlockDirectory(directory, [path.join(process.cwd(), 'public', 'page-blocks')]);
    initializedDirectories.add(directory);
  }
  return path.join(directory, `${page}.json`);
};

export const readPageBlockFile = async (page: string): Promise<unknown> =>
  JSON.parse(await readFile(getPageBlockPath(page), 'utf-8'));

export const writePageBlockFile = async (page: string, blocks: unknown[]) => {
  const filePath = getPageBlockPath(page);
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(
      temporaryPath,
      JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), pages: { [page]: blocks } }, null, 2),
      { flag: 'wx' }
    );
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
};
