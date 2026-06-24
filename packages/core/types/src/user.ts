export interface User {
  nickname: string;
  sub: string;
  userId: number;
}

export interface Tenant {
  /** 租户ID */
  tenantId: string;
  /** 租户名称 */
  tenantName: string;
  [key: string]: any;
}
