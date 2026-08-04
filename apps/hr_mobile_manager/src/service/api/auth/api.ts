import { getToken } from '@/hooks/use-auth';
import { AUTH_URLS } from './urls';
import alovaInstance from '../request';

export function fetchLogin(params: Api.LoginParams) {
  return alovaInstance.Post<Api.LoginResponse>(AUTH_URLS.LOGIN, params);
}

export function fetchGetUserInfo() {
  if (!getToken()) {
    return Promise.resolve(null);
  }

  return alovaInstance.Get<Api.UserInfo>(AUTH_URLS.GET_USER_INFO);
}

export function fetchRefreshToken(refreshToken: string) {
  return alovaInstance.Post<Api.Auth>(AUTH_URLS.REFRESH_TOKEN, { refreshToken });
}
