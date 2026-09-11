import type { ApiResult } from '@/api/employee';
import request from '@/lib/request';

/** 菜单类型 0.目录 1.菜单 2.按钮 */
export type MenuType = 0 | 1 | 2;

/** 菜单树节点（对齐后端 HrMenuTreeVO） */
export interface MenuTreeNode {
  children?: MenuTreeNode[];
  icon?: string;
  id: number;
  menuType: MenuType;
  parentId: number;
  path?: string;
  perms?: string;
  sort?: number;
  title: string;
  /** 是否显示 0.隐藏 1.显示 */
  visible: number;
}

/** 菜单新增/编辑入参（id 为空表示新增） */
export interface MenuSaveParams {
  icon?: string;
  id?: number;
  menuType: MenuType;
  parentId: number;
  path?: string;
  perms?: string;
  sort?: number;
  title: string;
  visible?: number;
}

/** 查询完整菜单树 */
export function getMenuTree() {
  return request.get<any, ApiResult<MenuTreeNode[]>>('menu/tree');
}

/** 新增/编辑菜单 */
export function saveMenu(data: MenuSaveParams) {
  return request.post<any, ApiResult<boolean>>('menu/submit', data);
}

/** 删除菜单（连同子孙节点） */
export function deleteMenu(id: number) {
  return request.post<any, ApiResult<boolean>>('menu/delete', null, { params: { id } });
}

/** 查询某职位已分配的菜单id集合（分配弹窗回显） */
export function getPositionMenuIds(positionId: number) {
  return request.get<any, ApiResult<number[]>>('position-menu/list', { params: { positionId } });
}

/** 职位分配菜单（全量覆盖：menuIds 即该职位最终拥有的菜单集合） */
export function assignPositionMenus(positionId: number, menuIds: number[]) {
  return request.post<any, ApiResult<boolean>>('position-menu/assign', { positionId, menuIds });
}
