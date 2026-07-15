import { z } from 'zod';

import { transformRecordToOption } from '@/utils/common';

const departmentNullableStringSearchSchema = z
  .string()
  .nullish()
  .catch(null)
  .transform(value => value || null);

const departmentEnableStatusSearchSchema = z
  .enum(['1', '2'])
  .nullish()
  .catch(null)
  .transform(value => value ?? null);

export const DepartmentSearchSchema = z.object({
  current: z.coerce.number().positive().catch(1).default(1),
  size: z.coerce.number().positive().catch(10).default(10),
  status: departmentEnableStatusSearchSchema,
  name: departmentNullableStringSearchSchema,
  code: departmentNullableStringSearchSchema,
  managerName: departmentNullableStringSearchSchema
});

export const departmentStatusRecord = {
  status: {
    '1': 'page.departments.common.status.enable',
    '2': 'page.departments.common.status.disable'
  }
} as const satisfies {
  status: Record<Api.Common.EnableStatus, I18n.I18nKey>;
};

export const departmentEnableStatusOptions = transformRecordToOption(departmentStatusRecord.status);

export const departmentEnableStatusTagColorRecord: Record<Api.Common.EnableStatus, string> = {
  '1': 'success',
  '2': 'default'
};

export function getDepartmentSearchInitialParams(): Api.Organization.DepartmentSearchParams {
  return {
    current: 1,
    size: 10,
    status: null,
    name: null,
    code: null,
    managerName: null
  };
}

export function normalizeDepartmentSearchSchema(
  params: Partial<Api.Organization.DepartmentSearchParams>
): Api.Organization.DepartmentSearchParams {
  return DepartmentSearchSchema.parse(params);
}
