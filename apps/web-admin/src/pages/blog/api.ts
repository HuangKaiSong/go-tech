import { type BlogCommand, adminSchema } from '@go-tech/blog-content/model';
import { getStoredToken } from '@/hooks/use-auth';
export async function blogRequest(command?: BlogCommand, signal?: AbortSignal) {
  const token = getStoredToken();
  const response = await fetch('/h5-hook/api/admin/blog', {
    method: command ? 'POST' : 'GET',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` } : {})
    },
    ...(command ? { body: JSON.stringify(command) } : {})
  });
  const result: unknown = await response.json();
  if (!response.ok || !result || typeof result !== 'object' || !('code' in result) || result.code !== 200) {
    throw new Error(
      result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
        ? result.message
        : '博客請求失敗'
    );
  }
  if (!('data' in result)) throw new Error('博客回應格式無效');
  return {
    ...adminSchema.parse(result.data),
    savedId: 'savedId' in result && typeof result.savedId === 'number' ? result.savedId : undefined
  };
}
