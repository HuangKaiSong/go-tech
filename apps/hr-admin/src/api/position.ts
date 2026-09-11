import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 职位列表/详情（对齐后端 PositionVO） */
export interface Position {
  id: number;
  code?: string;
  title: string;
  departmentId?: number;
  departmentName?: string;
  level?: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  memberCount: number;
  description?: string;
  /** 状态码 1.启用 2.停用 */
  statusCode: number;
  /** 状态文案 */
  status: string;
  /** 建立日期 yyyy-MM-dd */
  createdAt?: string;
}

/** 职位下拉选项 */
export interface PositionOption {
  id: number;
  title: string;
  departmentId?: number;
  departmentName?: string;
}

/** 职位在职人员（对齐后端 PositionMemberVO） */
export interface PositionMember {
  id: number;
  employeeNo?: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  joinDate?: string;
  /** 状态码 0已邀请待填 1待HR完善 2待入职 3在职 4休假中 5待离职 6已离职 */
  statusCode: number;
  status: string;
}

/** 职位查询参数 */
export interface PositionQuery {
  keyword?: string;
  departmentId?: number;
  status?: number;
}

/** 职位新增/编辑入参（id 为空表示新增） */
export interface PositionSaveParams {
  id?: number;
  title: string;
  departmentId: number;
  code?: string;
  level?: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  status?: number;
  /** 可选：分配的菜单id列表；传则一并同步该职位菜单授权，不传表示不改动 */
  menuIds?: number[];
}

/** 查询职位列表 */
export function getPositionList(params?: PositionQuery) {
  return request.get<any, ApiResult<Position[]>>("position/list", { params });
}

/** 查询职位详情 */
export function getPositionById(id: number) {
  return request.get<any, ApiResult<Position>>("position/getById", { params: { id } });
}

/** 职位下拉选项（可按部门过滤） */
export function getPositionOptions(departmentId?: number) {
  return request.get<any, ApiResult<PositionOption[]>>("position/options", { params: { departmentId } });
}

/** 新增/编辑职位 */
export function savePosition(data: PositionSaveParams) {
  return request.post<any, ApiResult<boolean>>("position/submit", data);
}

/** 删除职位 */
export function deletePosition(id: number) {
  return request.post<any, ApiResult<boolean>>("position/delete", null, { params: { id } });
}

/** 查询职位下的在职人员 */
export function getPositionMembers(positionId: number) {
  return request.get<any, ApiResult<PositionMember[]>>("position/members", { params: { positionId } });
}
