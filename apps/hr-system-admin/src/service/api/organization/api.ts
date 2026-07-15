import { matchKeyword, mockPaginate, mockResponse } from '../shared/mock';

import { MOCK_DEPARTMENTS, MOCK_ROLES } from './mock-data';

/**
 * Get department list
 *
 * 后端就绪后替换为： return request<Api.Organization.DepartmentList>({ method: 'get', params, url:
 * ORGANIZATION_URLS.GET_DEPARTMENT_LIST });
 */
export function fetchGetDepartmentList(params: Api.Organization.DepartmentSearchParams) {
  const filtered = MOCK_DEPARTMENTS.filter(item => {
    const matchName = matchKeyword(params.name, item.name, item.code, item.managerName);
    const matchStatus = !params.status || item.status === params.status;
    return matchName && matchStatus;
  });

  return mockResponse(mockPaginate(filtered, params));
}

/**
 * Get role list
 *
 * 后端就绪后替换为： return request<Api.Organization.RoleList>({ method: 'get', params, url:
 * ORGANIZATION_URLS.GET_ROLE_LIST });
 */
export function fetchGetJobRoleList(params: Api.Organization.RoleSearchParams) {
  const filtered = MOCK_ROLES.filter(item => {
    const matchTitle = matchKeyword(params.title, item.title, item.department);
    const matchDept = !params.department || item.department === params.department;
    const matchLevel = !params.level || item.level === params.level;
    const matchStatus = !params.status || item.status === params.status;
    return matchTitle && matchDept && matchLevel && matchStatus;
  });

  return mockResponse(mockPaginate(filtered, params));
}
