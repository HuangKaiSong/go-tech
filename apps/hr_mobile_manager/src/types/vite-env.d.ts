/// <reference types="vite/client" />

declare namespace Env {
  interface AppImportMetaEnv {
    /**
     * 是否启用http代理
     *
     * 只在 dev 环境下有效
     */
    readonly VITE_HTTP_PROXY?: Common.YesOrNo;
    /**
     * 其他后端服务地址址
     *
     * The value is a json
     */
    readonly VITE_OTHER_SERVICE_BASE_URL: string;

    /** 在终端显示代理 url */
    readonly VITE_PROXY_LOG?: Common.YesOrNo;

    /** 后端服务地址 */
    readonly VITE_SERVICE_BASE_URL: string;
    /** 用于区分不同域之间的存储 */
    readonly VITE_STORAGE_PREFIX?: string;
  }


  type ImportMeta = AppImportMetaEnv;
}

interface ImportMetaEnv extends Env.AppImportMetaEnv {}
