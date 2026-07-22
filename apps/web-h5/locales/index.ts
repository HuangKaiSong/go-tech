
import fs from 'node:fs';
import path from 'node:path';

type Cache = {
  data: Record<string, unknown>;
  mtime: number;
};

const cache = new Map<string, Cache>();

function initLocale(lang: string) {
  const file = path.join(
    process.cwd(),
    'locales',
    lang,
    'index.json'
  );

  const stat = fs.statSync(file);

  const mtime = stat.mtimeMs;

  const old = cache.get(lang);

  if (old && old.mtime === mtime) {
    return old.data;
  }

  const data = JSON.parse(
    fs.readFileSync(file, 'utf8')
  );

  cache.set(lang, {
    mtime,
    data,
  });

  return data;
}

export function loadLocale(lang: string) {
  return initLocale(lang)
}


export function loadLocales() {
  return {
    'zh-hk': initLocale('zh-hk'),
    'zh-cn': initLocale('zh-cn'),
    'en-us': initLocale('en-us'),
  };
}
