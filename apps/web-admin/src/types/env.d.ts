/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_H5_SITE_URL: string;
  readonly VITE_PROXY_PREFIX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
