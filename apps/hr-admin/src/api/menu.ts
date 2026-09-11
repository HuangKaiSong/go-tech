import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 菜单类型 0.目录 1.菜单 2.按钮 */
export type MenuType = 0 | 1 | 2;

/** 菜单树节点（对齐后端 HrMenuTreeVO） */
export interface MenuTreeNode {
  id: number;
  parentId: number;
  title: string;
  icon?: string;
  path?: string;
  perms?: string;
  menuType: MenuType;
  sort?: number;
  /** 是否显示 0.隐藏 1.显示 */
  visible: number;
  children?: MenuTreeNode[];
}

/** 菜单新增/编辑入参（id 为空表示新增） */
export interface MenuSaveParams {
  id?: number;
  parentId: number;
  title: string;
  icon?: string;
  path?: string;
  perms?: string;
  menuType: MenuType;
  sort?: number;
  visible?: number;
}

/** 查询完整菜单树 */
export function getMenuTree() {
  return request.get<any, ApiResult<MenuTreeNode[]>>("menu/tree");
}

/** 新增/编辑菜单 */
export function saveMenu(data: MenuSaveParams) {
  return request.post<any, ApiResult<boolean>>("menu/submit", data);
}

/** 删除菜单（连同子孙节点） */
export function deleteMenu(id: number) {
  return request.post<any, ApiResult<boolean>>("menu/delete", null, { params: { id } });
}

/** 查询某职位已分配的菜单id集合（分配弹窗回显） */
export function getPositionMenuIds(positionId: number) {
  return request.get<any, ApiResult<number[]>>("position-menu/list", { params: { positionId } });
}

/** 职位分配菜单（全量覆盖：menuIds 即该职位最终拥有的菜单集合） */
export function assignPositionMenus(positionId: number, menuIds: number[]) {
  return request.post<any, ApiResult<boolean>>("position-menu/assign", { positionId, menuIds });
}
