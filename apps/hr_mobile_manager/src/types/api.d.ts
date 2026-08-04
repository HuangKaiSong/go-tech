// oxlint-disable unicorn/require-module-specifiers
declare global {
  namespace Api {
    interface Auth {
      /** 身份验证流程拥有的刷新令牌. 一般比访问令牌时间长*/
      refreshToken?: string;
      /** 身份验证流程拥有的访问令牌. */
      token: string
    }

    /** 登录响应数据 */
    type LoginResponse = Auth;

    /** 用户数据 */
    interface UserInfo {
      /** 按钮权限编码列表 */
      buttons: string[];
      /** 角色编码列表 */
      roles: string[];
      /** 用户 ID */
      userId: string;
      /** 用户名 */
      userName: string;
    }

    /** 登录参数 */
    interface LoginParams {

    }
  }
}

export { };
