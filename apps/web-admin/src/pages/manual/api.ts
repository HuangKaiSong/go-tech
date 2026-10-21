import { type ManualCommand, manualAdminSchema } from '@go-tech/manual-content/model';
import { getStoredToken } from '@/hooks/use-auth';
/** 使用管理员凭证读写手册，并校验响应契约；signal 用于取消组件卸载后的读取。 */
export async function manualRequest(command?: ManualCommand, signal?: AbortSignal) {
  const token = getStoredToken();
  const response = await fetch('/h5-hook/api/admin/manual', {
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
    const message =
      result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
        ? result.message
        : '操作手冊請求失敗';
    throw new Error(message);
  }
  if (!('data' in result)) throw new Error('操作手冊回應格式無效');
  return {
    ...manualAdminSchema.parse(result.data),
    savedId: 'savedId' in result && typeof result.savedId === 'number' ? result.savedId : undefined
  };
}
