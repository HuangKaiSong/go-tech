import { globalStore, updateAtomValue } from '@go-tech/core-state';
import { atom, useAtom } from 'jotai';
import { fetchGetUserInfo } from '@/service/api/auth/api';
import { localStg } from '@/utils/storage';

const initToken = getToken();

interface AuthState {
  /** 是否完成首轮认证初始化。 */
  initialized: boolean;
  /** 当前 access token，空值表示未登录。 */
  token: string | null;
  /** 当前登录用户信息，空值表示尚未获取。 */
  userInfo: Api.UserInfo | null;
}

const initState: AuthState = {
  token: initToken,
  userInfo: null,
  initialized: false
};

const authAtom = atom(initState);

export function getToken() {
  return localStg.get('token');
}

export function clearAuthStorage() {
  localStg.remove('token');
  localStg.remove('refreshToken');
}

export function setAuth(data: Api.Auth) {
  updateAtomValue(authAtom, prev => ({ ...prev, token: data.token }));

  localStg.set('token', data.token);
  if (data.refreshToken) {
    localStg.set('refreshToken', data.refreshToken);
  }
}

export function useAuth() {
  const [state, setState] = useAtom(authAtom, { store: globalStore });
  const isLoggedIn = Boolean(state.token);
  const userInfo = state.userInfo ?? undefined;

  function hasAuth(codes: string | string[]) {
    if (!isLoggedIn || !userInfo) return false;

    const buttons = userInfo.buttons ?? [];

    if (typeof codes === 'string') {
      return buttons.includes(codes);
    }

    return codes.some(code => buttons.includes(code));
  }

  async function initAuth() {
    try {
      const data = await fetchGetUserInfo();

      setState(prev => ({ ...prev, userInfo: data ?? null, initialized: true }));

      return data ?? null;
    } catch {
      setState(prev => ({ ...prev, initialized: true }));

      return null;
    }
  }

  function clearAuth() {
    setState(prev => ({ ...prev, token: null, userInfo: null }));

    clearAuthStorage();
  }

  return {
    token: state.token,
    userInfo,
    isLoggedIn,
    clearAuth,
    initAuth,
    isAuthInitialized: state.initialized,
    hasAuth,
    setAuth
  };
}
