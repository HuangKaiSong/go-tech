import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 部门列表/详情（对齐后端 DepartmentVO） */
export interface Department {
  budget?: number;
  code: string;
  /** 建立日期 yyyy-MM-dd */
  createdAt?: string;
  description?: string;
  email?: string;
  id: number;
  managerId?: number;
  managerName?: string;
  memberCount: number;
  name: string;
  parentId?: number;
  parentName?: string;
  phone?: string;
  /** 状态文案 */
  status: string;
  /** 状态码 1.启用 2.停用 */
  statusCode: number;
}

/** 部门下拉选项 */
export interface DepartmentOption {
  id: number;
  name: string;
}

/** 部门成员（对齐后端 DepartmentMemberVO） */
export interface DepartmentMember {
  avatarUrl?: string;
  employeeNo?: string;
  id: number;
  joinDate?: string;
  name: string;
  phone?: string;
  position?: string;
  status: string;
  /** 状态码 0已邀请待填 1待HR完善 2待入职 3在职 4休假中 5待离职 6已离职 */
  statusCode: number;
}

/** 部门查询参数 */
export interface DepartmentQuery {
  keyword?: string;
  status?: number;
}

/** 部门新增/编辑入参（id 为空表示新增） */
export interface DepartmentSaveParams {
  budget?: number;
  code: string;
  description?: string;
  email?: string;
  id?: number;
  managerId?: number;
  managerName?: string;
  name: string;
  parentId?: number;
  phone?: string;
  status?: number;
}

/** 查询部门列表 */
export function getDepartmentList(params?: DepartmentQuery) {
  return request.get<any, ApiResult<Department[]>>('department/list', { params });
}

/** 查询部门详情 */
export function getDepartmentById(id: number) {
  return request.get<any, ApiResult<Department>>('department/getById', { params: { id } });
}

/** 部门下拉选项（上级部门选择用；excludeId 排除自身） */
export function getDepartmentOptions(excludeId?: number) {
  return request.get<any, ApiResult<DepartmentOption[]>>('department/options', { params: { excludeId } });
}

/** 新增/编辑部门 */
export function saveDepartment(data: DepartmentSaveParams) {
  return request.post<any, ApiResult<boolean>>('department/submit', data);
}

/** 删除部门 */
export function deleteDepartment(id: number) {
  return request.post<any, ApiResult<boolean>>('department/delete', null, { params: { id } });
}

/** 查询部门下的成员 */
export function getDepartmentMembers(departmentId: number) {
  return request.get<any, ApiResult<DepartmentMember[]>>('department/members', { params: { departmentId } });
}

/** 组织架构树 - 职位节点 */
export interface OrgPosition {
  id: number;
  level?: string;
  memberCount: number;
  title: string;
}

/** 组织架构树 - 部门节点（嵌套子部门 + 职位） */
export interface OrgDeptNode {
  children: OrgDeptNode[];
  code: string;
  id: number;
  memberCount: number;
  name: string;
  positions: OrgPosition[];
  status: string;
  statusCode: number;
}

/** 组织架构树（部门层级为骨架，节点下挂职位） */
export function getOrgTree() {
  return request.get<any, ApiResult<OrgDeptNode[]>>('department/org-tree');
}
