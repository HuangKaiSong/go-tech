/** Organization module query keys */

export const ORGANIZATION_QUERY_KEYS = {
  DEPARTMENT_LIST: (params: Api.Organization.DepartmentSearchParams) =>
    ['organization', 'departmentList', params] as const,
  ROLE_LIST: (params: Api.Organization.RoleSearchParams) => ['organization', 'roleList', params] as const
} as const;
