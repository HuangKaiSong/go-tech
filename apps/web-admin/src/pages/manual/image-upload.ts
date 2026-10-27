import { safeManualUrl } from '@go-tech/manual-content/model';
import { getStoredToken } from '@/hooks/use-auth';

export const manualImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const manualImageLimit = 10 * 1024 * 1024;

/** 文件选择和剪贴板使用同一入口；拒绝不支持的格式，避免绕过原上传控件的限制。 */
export function validateImageFile(file: File): string | null {
  if (!manualImageTypes.includes(file.type)) return '僅支援 PNG、JPEG、WebP 和 GIF 圖片';
  if (file.size === 0) return '圖片內容為空，請重新複製或選擇圖片';
  if (file.size > manualImageLimit) return '圖片不可超過 10 MB';
  return null;
}

/** 默认说明无需用户再次确认；截图没有有效文件名时使用通用描述，仍可选中图片后修改。 */
export function imageDescription(file: File): string {
  const name = file.name.replace(/\.[^.]+$/, '').trim();
  return (name || '貼上的圖片').slice(0, 500);
}

/** 不手动设置 multipart Content-Type，让浏览器生成 boundary；明确附带当前管理员凭证。 */
export async function uploadManualImage(file: File, signal: AbortSignal): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  const body = new FormData();
  body.append('file', file);
  const token = getStoredToken();
  const response = await fetch('/api/pms-resource/web-back/minio/upload', {
    method: 'POST',
    body,
    signal,
    headers: token ? { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` } : {}
  });
  const result: unknown = await response.json();
  if (!response.ok || !result || typeof result !== 'object') throw new Error('圖片上傳失敗，請重試');
  if ('code' in result && result.code !== 200 && result.code !== '200') throw new Error('圖片上傳未成功，請重試');
  const data = 'data' in result ? result.data : null;
  const url = data && typeof data === 'object' && 'url' in data ? data.url : null;
  if (typeof url !== 'string' || !safeManualUrl(url, true)) throw new Error('上傳服務未返回有效圖片網址');
  return url;
}

/** 剪贴板同时含 files 和 items 时仅取一份，防止浏览器附带 HTML 后重复插入图片。 */
export function clipboardImages(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files = Array.from(data.files ?? []);
  if (files.length) return files.filter(file => file.type.startsWith('image/'));
  return Array.from(data.items ?? []).flatMap(item => {
    const file = item.kind === 'file' ? item.getAsFile() : null;
    return file?.type.startsWith('image/') ? [file] : [];
  });
}
