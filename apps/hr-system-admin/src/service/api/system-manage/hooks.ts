import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import {
  fetchGetAllPages,
  fetchGetAllRoles,
  fetchGetMenuList,
  fetchGetMenuTree,
  fetchGetRoleList,
  fetchGetUserList
} from './api';
import { SYSTEM_MANAGE_QUERY_KEYS } from './keys';

type ServiceQueryOptions<Response, Data = Response> = Omit<
  UseQueryOptions<Response, Error, Data, QueryKey>,
  'queryFn' | 'queryKey'
>;

/**
 * Get role list query hook
 *
 * @example
 *   const { data: roleList, isLoading } = useRoleListQuery({ current: 1, size: 10 });
 *
 * @param params - Search parameters
 */
export function useRoleListQuery<Data = Api.SystemManage.RoleList>(
  params: Api.SystemManage.RoleSearchParams,
  options?: ServiceQueryOptions<Api.SystemManage.RoleList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetRoleList(params),
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.ROLE_LIST(params)
  });
}

/**
 * Get all roles query hook
 *
 * @example
 *   const { data: allRoles, isLoading } = useAllRolesQuery();
 */
export function useAllRolesQuery<Data = Api.SystemManage.AllRole[]>(
  options?: ServiceQueryOptions<Api.SystemManage.AllRole[], Data>
) {
  return useQuery({
    staleTime: 0,
    ...options,
    queryFn: fetchGetAllRoles,
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.ALL_ROLES
  });
}

/**
 * Get user list query hook
 *
 * @example
 *   const { data: userList, isLoading } = useUserListQuery({ current: 1, size: 10 });
 *
 * @param params - Search parameters
 */
export function useUserListQuery<Data = Api.SystemManage.UserList>(
  params: Api.SystemManage.UserSearchParams,
  options?: ServiceQueryOptions<Api.SystemManage.UserList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetUserList(params),
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.USER_LIST(params)
  });
}

/**
 * Get menu list query hook
 *
 * @example
 *   const { data: menuList, isLoading } = useMenuListQuery();
 */
export function useMenuListQuery<Data = Api.SystemManage.MenuList>(
  options?: ServiceQueryOptions<Api.SystemManage.MenuList, Data>
) {
  return useQuery({
    ...options,
    queryFn: fetchGetMenuList,
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.MENU_LIST
  });
}

/**
 * Get all pages query hook
 *
 * @example
 *   const { data: allPages, isLoading } = useAllPagesQuery();
 */
export function useAllPagesQuery<Data = string[]>(options?: ServiceQueryOptions<string[], Data>) {
  return useQuery({
    staleTime: 0,
    ...options,
    queryFn: fetchGetAllPages,
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.ALL_PAGES
  });
}

/**
 * Get menu tree query hook
 *
 * @example
 *   const { data: menuTree, isLoading } = useMenuTreeQuery();
 */
export function useMenuTreeQuery<Data = Api.SystemManage.MenuTree[]>(
  options?: ServiceQueryOptions<Api.SystemManage.MenuTree[], Data>
) {
  return useQuery({
    ...options,
    queryFn: fetchGetMenuTree,
    queryKey: SYSTEM_MANAGE_QUERY_KEYS.MENU_TREE
  });
}
