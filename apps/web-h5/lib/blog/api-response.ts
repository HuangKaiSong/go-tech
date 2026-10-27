import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { BlogError } from './error';
export const blogHeaders = { 'Cache-Control': 'no-store' };
export function blogFailure(error: unknown) {
  let status = 503;
  let message = '博客暫時無法載入，請稍後重試';
  if (error instanceof BlogError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof SyntaxError || error instanceof ZodError) {
    status = 400;
    message = '提交格式無效';
  }
  return NextResponse.json({ code: status, message }, { status, headers: blogHeaders });
}
