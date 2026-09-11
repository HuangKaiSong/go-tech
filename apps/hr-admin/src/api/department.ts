import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 部门列表/详情（对齐后端 DepartmentVO） */
export interface Department {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  parentName?: string;
  managerId?: number;
  managerName?: string;
  phone?: string;
  email?: string;
  memberCount: number;
  budget?: number;
  description?: string;
  /** 状态码 1.启用 2.停用 */
  statusCode: number;
  /** 状态文案 */
  status: string;
  /** 建立日期 yyyy-MM-dd */
  createdAt?: string;
}

/** 部门下拉选项 */
export interface DepartmentOption {
  id: number;
  name: string;
}

/** 部门成员（对齐后端 DepartmentMemberVO） */
export interface DepartmentMember {
  id: number;
  employeeNo?: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  position?: string;
  joinDate?: string;
  /** 状态码 0已邀请待填 1待HR完善 2待入职 3在职 4休假中 5待离职 6已离职 */
  statusCode: number;
  status: string;
}

/** 部门查询参数 */
export interface DepartmentQuery {
  keyword?: string;
  status?: number;
}

/** 部门新增/编辑入参（id 为空表示新增） */
export interface DepartmentSaveParams {
  id?: number;
  name: string;
  code: string;
  parentId?: number;
  managerId?: number;
  managerName?: string;
  phone?: string;
  email?: string;
  budget?: number;
  description?: string;
  status?: number;
}

/** 查询部门列表 */
export function getDepartmentList(params?: DepartmentQuery) {
  return request.get<any, ApiResult<Department[]>>("department/list", { params });
}

/** 查询部门详情 */
export function getDepartmentById(id: number) {
  return request.get<any, ApiResult<Department>>("department/getById", { params: { id } });
}

/** 部门下拉选项（上级部门选择用；excludeId 排除自身） */
export function getDepartmentOptions(excludeId?: number) {
  return request.get<any, ApiResult<DepartmentOption[]>>("department/options", { params: { excludeId } });
}

/** 新增/编辑部门 */
export function saveDepartment(data: DepartmentSaveParams) {
  return request.post<any, ApiResult<boolean>>("department/submit", data);
}

/** 删除部门 */
export function deleteDepartment(id: number) {
  return request.post<any, ApiResult<boolean>>("department/delete", null, { params: { id } });
}

/** 查询部门下的成员 */
export function getDepartmentMembers(departmentId: number) {
  return request.get<any, ApiResult<DepartmentMember[]>>("department/members", { params: { departmentId } });
}

/** 组织架构树 - 职位节点 */
export interface OrgPosition {
  id: number;
  title: string;
  level?: string;
  memberCount: number;
}

/** 组织架构树 - 部门节点（嵌套子部门 + 职位） */
export interface OrgDeptNode {
  id: number;
  name: string;
  code: string;
  memberCount: number;
  statusCode: number;
  status: string;
  positions: OrgPosition[];
  children: OrgDeptNode[];
}

/** 组织架构树（部门层级为骨架，节点下挂职位） */
export function getOrgTree() {
  return request.get<any, ApiResult<OrgDeptNode[]>>("department/org-tree");
}
