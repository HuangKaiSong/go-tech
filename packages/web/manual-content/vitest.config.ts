/** 内容契约测试运行在 Node 环境，不依赖浏览器或编辑器实例。 */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/*.test.ts'] } });
