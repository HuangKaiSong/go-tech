import { NextResponse } from 'next/server';
import { ManualError } from './service';
/** 管理资料和公开快照都不允许 HTTP 缓存，防止草稿缓存泄露或发布后仍显示旧内容。 */
export const manualHeaders = { 'Cache-Control': 'no-store' };
/** 保留业务状态码，但不将数据库错误、连接信息或正文内容返回浏览器。 */
export function manualFailure(error: unknown) {
  let status = 503;
  let message = '操作手冊暫時無法載入，請稍後重試';
  if (error instanceof ManualError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof SyntaxError) {
    status = 400;
    message = '提交格式無效';
  }
  return NextResponse.json({ code: status, message }, { status, headers: manualHeaders });
}
