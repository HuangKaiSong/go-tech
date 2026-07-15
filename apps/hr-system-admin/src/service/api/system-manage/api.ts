import { request } from '../../request';

import { SYSTEM_MANAGE_URLS } from './urls';

/** Get role list */
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    method: 'get',
    params,
    url: SYSTEM_MANAGE_URLS.GET_ROLE_LIST
  });
}

/**
 * Get all roles
 *
 * These roles are all enabled
 */
export function fetchGetAllRoles() {
  return request<Api.SystemManage.AllRole[]>({
    method: 'get',
    url: SYSTEM_MANAGE_URLS.GET_ALL_ROLES
  });
}

/** Get user list */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    method: 'get',
    params,
    url: SYSTEM_MANAGE_URLS.GET_USER_LIST
  });
}

/** Get menu list */
export function fetchGetMenuList() {
  return request<Api.SystemManage.MenuList>({
    method: 'get',
    url: SYSTEM_MANAGE_URLS.GET_MENU_LIST
  });
}

/** Get all pages */
export function fetchGetAllPages() {
  return request<string[]>({
    method: 'get',
    url: SYSTEM_MANAGE_URLS.GET_ALL_PAGES
  });
}

/** Get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    method: 'get',
    url: SYSTEM_MANAGE_URLS.GET_MENU_TREE
  });
}
