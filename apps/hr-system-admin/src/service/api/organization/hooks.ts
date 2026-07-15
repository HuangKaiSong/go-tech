import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { fetchGetDepartmentList, fetchGetJobRoleList } from './api';
import { ORGANIZATION_QUERY_KEYS } from './keys';

type ServiceQueryOptions<Response, Data = Response> = Omit<
  UseQueryOptions<Response, Error, Data, QueryKey>,
  'queryFn' | 'queryKey'
>;

/**
 * Get department list query hook
 *
 * @param params - Search parameters
 */
export function useDepartmentListQuery<Data = Api.Organization.DepartmentList>(
  params: Api.Organization.DepartmentSearchParams,
  options?: ServiceQueryOptions<Api.Organization.DepartmentList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetDepartmentList(params),
    queryKey: ORGANIZATION_QUERY_KEYS.DEPARTMENT_LIST(params)
  });
}

/**
 * Get role list query hook
 *
 * @param params - Search parameters
 */
export function useJobRoleListQuery<Data = Api.Organization.RoleList>(
  params: Api.Organization.RoleSearchParams,
  options?: ServiceQueryOptions<Api.Organization.RoleList, Data>
) {
  return useQuery({
    ...options,
    queryFn: () => fetchGetJobRoleList(params),
    queryKey: ORGANIZATION_QUERY_KEYS.ROLE_LIST(params)
  });
}
