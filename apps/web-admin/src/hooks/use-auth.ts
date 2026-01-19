import { useLocalStorageState } from 'ahooks'
import { useMemo } from 'react';

export const TOKEN_KEY = 'xiaokeai_token';


function parseJwtPayload(token: string | null): any | null {
  if (!token) return null;
  
  try {
    // 移除 "Bearer " 前缀（如果存在）
    const actualToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // 将 JWT token 分为三部分
    const parts = actualToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // 解码 payload 部分（第二部分）
    const payload = parts[1];
    // Base64 解码
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return true; // 如果没有 exp 字段，则认为已过期
  }

  // exp 是 Unix 时间戳（秒），需要转换为毫秒并与当前时间比较
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
}

export function useAuth() {
  const [token, setToken] = useLocalStorageState(TOKEN_KEY, {
    defaultValue: null,
    listenStorageChange: true
  })

  const user = useMemo(() => {
    if (token) {
      return parseJwtPayload(token)
    }
    return null
  }, [token])

  const isExpired = useMemo(() => isTokenExpired(token), [token]);

  return {
    token,
    setToken,
    user,
    isExpired,
    isAuthenticated: !isExpired && !!token
  }
}