import type { PageBlock } from "@/app/components/PageBlocks";
import { readFile } from "fs/promises";
import path from "path";

type PageBlocksFile = {
  blocks?: PageBlock[];
  pages?: Record<string, PageBlock[]>;
};

export const loadPageBlocks = async (
  pageKey: string,
  fallback: PageBlock[],
): Promise<PageBlock[]> => {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "page-blocks",
      `${pageKey}.json`,
    );
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as PageBlocksFile;
    if (Array.isArray(parsed.blocks)) return parsed.blocks;
    if (parsed.pages && Array.isArray(parsed.pages[pageKey])) {
      return parsed.pages[pageKey];
    }
  } catch {
    // ignore missing or invalid file
  }
  return fallback;
};
