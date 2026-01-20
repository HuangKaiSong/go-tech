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

    // 获取 payload 部分并转换为标准 Base64 格式
    let payload = parts[1];
    
    // 将 Base64 URL 安全编码转换为标准 Base64 编码
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    // 添加缺少的填充字符
    while (payload.length % 4) {
      payload += '=';
    }

    if (typeof TextDecoder !== 'undefined') {
      const binaryString = atob(payload);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const utf8String = new TextDecoder().decode(bytes, { stream: true });
      return JSON.parse(utf8String);
    } else {
      // 兼容旧浏览器的方法
      const binaryString = window.atob(payload);
      const utf8String = decodeURIComponent(escape(binaryString));
      return JSON.parse(utf8String);
    }
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
  const [token, setToken] = useLocalStorageState<string | undefined>(TOKEN_KEY, {
    defaultValue: undefined,
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