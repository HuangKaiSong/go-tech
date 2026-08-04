import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 员工下拉选项（对齐后端 EmployeeOptionVO） */
export interface EmployeeOption {
  employeeNo?: string;
  id: number;
  name: string;
}

/** 在职员工下拉选项 */
export function getActiveEmployeeOptions() {
  return request.get<any, ApiResult<EmployeeOption[]>>("employee/activeOptions");
}

/** 当前登录员工个人信息（对齐后端 EmployeeDetailVO，仅取「我的」页所需字段） */
export interface MyProfile {
  address?: string;
  department?: string;
  email?: string;
  employeeNo?: string;
  employmentType?: string;
  englishName?: string;
  gender?: string;
  id: number;
  joinDate?: string;
  name?: string;
  phone?: string;
  position?: string;
  status?: string;
}

/** 当前登录员工个人信息（手机端「我的」页） */
export function getMyProfile() {
  return request.get<any, ApiResult<MyProfile>>("employee/me");
}

/** 通讯录条目（对齐后端 EmployeeVO） */
export interface DirectoryEmployee {
  department?: string;
  employeeNo?: string;
  id: number;
  joinDate?: string;
  name: string;
  phone?: string;
  position?: string;
  status?: string;
}

/** 分页返回（MyBatis-Plus IPage） */
interface PageResult<T> {
  records: T[];
  total: number;
}

/** 员工通讯录（一次拉全，前端分组/搜索/筛选） */
export function getEmployeeDirectory() {
  return request.get<any, ApiResult<PageResult<DirectoryEmployee>>>("employee/list", {
    params: { current: 1, size: 1000 },
  });
}

/** 员工详情（通讯录点开某人时拉 email/地址等，复用 me 的 MyProfile 结构） */
export function getEmployeeDetailById(id: number) {
  return request.get<any, ApiResult<MyProfile>>("employee/getById", { params: { id } });
}

/** 组织架构树节点（对齐后端 OrgDeptNodeVO） */
export interface OrgDeptNode {
  children?: OrgDeptNode[];
  code?: string;
  id: number;
  memberCount?: number;
  name: string;
  status?: string;
  statusCode?: number;
}

/** 组织架构树（部门层级嵌套，含在职人数） */
export function getOrgTree() {
  return request.get<any, ApiResult<OrgDeptNode[]>>("department/org-tree");
}
