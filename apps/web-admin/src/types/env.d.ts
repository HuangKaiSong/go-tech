interface ImportMetaEnv {
  readonly VITE_H5_SITE_URL: string;
  // 可以根据需要添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}