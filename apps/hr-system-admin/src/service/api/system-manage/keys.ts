/** System manage module query keys */

export const SYSTEM_MANAGE_QUERY_KEYS = {
  ALL_PAGES: ['systemManage', 'allPages'] as const,
  ALL_ROLES: ['systemManage', 'allRoles'] as const,
  MENU_LIST: ['systemManage', 'menuList'] as const,
  MENU_TREE: ['systemManage', 'menuTree'] as const,
  ROLE_LIST: (params: Api.SystemManage.RoleSearchParams) => ['systemManage', 'roleList', params] as const,
  USER_LIST: (params: Api.SystemManage.UserSearchParams) => ['systemManage', 'userList', params] as const
} as const;
