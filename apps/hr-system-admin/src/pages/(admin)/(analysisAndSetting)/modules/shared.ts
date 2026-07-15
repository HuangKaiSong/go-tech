import { z } from 'zod';

import { transformRecordToOption } from '@/utils/common';

const userNullableStringSearchSchema = z
  .string()
  .nullish()
  .catch(null)
  .transform(value => value || null);

const userEnableStatusSearchSchema = z
  .enum(['1', '2'])
  .nullish()
  .catch(null)
  .transform(value => value ?? null);

export const UserSearchSchema = z.object({
  current: z.coerce.number().positive().catch(1).default(1),
  nickName: userNullableStringSearchSchema,
  size: z.coerce.number().positive().catch(10).default(10),
  status: userEnableStatusSearchSchema,
  userEmail: userNullableStringSearchSchema,
  userGender: userEnableStatusSearchSchema,
  userName: userNullableStringSearchSchema,
  userPhone: userNullableStringSearchSchema
});

export const userStatusRecord = {
  gender: {
    '1': 'page.manage.user.gender.male',
    '2': 'page.manage.user.gender.female'
  },
  status: {
    '1': 'page.manage.common.status.enable',
    '2': 'page.manage.common.status.disable'
  }
} as const satisfies {
  gender: Record<Api.SystemManage.UserGender, I18n.I18nKey>;
  status: Record<Api.Common.EnableStatus, I18n.I18nKey>;
};

export const userGenderOptions = transformRecordToOption(userStatusRecord.gender);

export const enableStatusOptions = transformRecordToOption(userStatusRecord.status);

export const userGenderTagColorRecord: Record<Api.SystemManage.UserGender, string> = {
  '1': 'processing',
  '2': 'error'
};

export const enableStatusTagColorRecord: Record<Api.Common.EnableStatus, string> = {
  '1': 'success',
  '2': 'error'
};

export function getUserSearchInitialParams(): Api.SystemManage.UserSearchParams {
  return {
    current: 1,
    nickName: null,
    size: 10,
    status: null,
    userEmail: null,
    userGender: null,
    userName: null,
    userPhone: null
  };
}

export function normalizeUserSearchParams(
  params: Partial<Api.SystemManage.UserSearchParams>
): Api.SystemManage.UserSearchParams {
  return UserSearchSchema.parse(params);
}
