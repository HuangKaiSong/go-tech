import { connection } from 'next/server';
import type { PageBlock } from '@/app/components/PageBlocks';
import { readPageBlockFile } from '@/lib/page-block-storage';

type PageBlocksFile = {
  blocks?: PageBlock[];
  pages?: Record<string, PageBlock[]>;
};

export const loadPageBlocks = async (pageKey: string, fallback: PageBlock[]): Promise<PageBlock[]> => {
  await connection();
  try {
    const parsed = (await readPageBlockFile(pageKey)) as PageBlocksFile;
    if (Array.isArray(parsed.blocks)) return parsed.blocks;
    if (parsed.pages && Array.isArray(parsed.pages[pageKey])) {
      return parsed.pages[pageKey];
    }
  } catch {
    // ignore missing or invalid file
  }
  return fallback;
};
