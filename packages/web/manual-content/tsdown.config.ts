/** 共享渲染包以 React 为外部依赖，避免前台与后台打包多份 React。 */
import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/index.tsx', 'src/model.ts'],
  dts: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'zod'],
  platform: 'neutral'
});
