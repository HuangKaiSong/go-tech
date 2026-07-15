import { getToken } from '@/features/auth/use-auth';

import { request } from '../../request';

import { AUTH_URLS } from './urls';

export function fetchLogin(params: Api.Auth.LoginParams) {
  return request<Api.Auth.LoginResponse>({
    data: params,
    method: 'post',
    url: AUTH_URLS.LOGIN
  });
}

export function fetchGetUserInfo() {
  if (!getToken()) {
    return Promise.resolve(null);
  }

  return request<Api.Auth.UserInfo>({ url: AUTH_URLS.GET_USER_INFO });
}

export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    data: {
      refreshToken
    },
    method: 'post',
    url: AUTH_URLS.REFRESH_TOKEN
  });
}

export function fetchCustomBackendError(code: string, msg: string) {
  return request({ params: { code, msg }, url: AUTH_URLS.ERROR });
}
