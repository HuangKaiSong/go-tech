// oxlint-disable unicorn/require-module-specifiers
declare global {
  namespace StorageType {
    type Theme = 'dark' | 'light';

    interface Local {
      /** 身份验证流程拥有的刷新令牌. */
      refreshToken: string;
      /** 系统主题 */
      theme: Theme;
      /** 身份验证流程拥有的访问令牌. */
      token: string
    }
  }
}

export { };
