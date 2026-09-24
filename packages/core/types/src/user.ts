export interface User {
  companyName: string;
  custCode: string;
  email: string;
  exp: number;
  nickname: string;
  phone: string;
  registerTime: string;
  tenantId: string;
  userId: number;
  username: string;
  userType: number;
  vipLevel: number;
}

export interface Tenant {
  /** 租户ID */
  tenantId: string;
  /** 租户名称 */
  tenantName: string;
  [key: string]: any;
}
