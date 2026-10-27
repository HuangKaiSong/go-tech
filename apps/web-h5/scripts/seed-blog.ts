import { createRequire } from 'node:module';
import path from 'node:path';

/** 从 Next.js 自身定位环境加载器，兼容 pnpm 的严格依赖解析并复用应用环境优先级。 */
const appRequire = createRequire(path.join(process.cwd(), 'package.json'));
const { loadEnvConfig } = createRequire(appRequire.resolve('next/package.json'))('@next/env') as {
  loadEnvConfig: (root: string, dev: boolean) => void;
};
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ||= path.join(process.cwd(), 'data/runtime-config/config.sqlite');
/** 环境加载后再导入数据库模块；无论初始化成功与否都释放 CLI 使用的连接池。 */
async function run() {
  const { seedBlog } = await import('../db/seeds/blog');
  const { currentDatabase } = await import('../db');
  try {
    console.log((await seedBlog()) ? '博客初始化完成（4 個分類、6 篇文章）' : '博客已初始化，未修改現有內容');
  } finally {
    await currentDatabase().pool.end();
  }
}
run().catch(() => {
  console.error('博客初始化失敗，請檢查資料庫連線及遷移');
  process.exitCode = 1;
});
