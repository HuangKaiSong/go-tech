export interface User {
  exp: number;
  nickname: string;
  sub: string;
  tenantId: string;
  userId: number;
  username: string;
}

export interface Tenant {
  /** 租户ID */
  tenantId: string;
  /** 租户名称 */
  tenantName: string;
  [key: string]: any;
}
