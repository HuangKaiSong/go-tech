import { and, eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { umsAdmin } from '@/db/scheam';

export interface FeedbackAdmin {
  id: number;
}

type AdminAuthResult = { admin: FeedbackAdmin; response?: never } | { admin?: never; response: NextResponse };

export async function requireFeedbackAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const authorization = req.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    return { response: NextResponse.json({ success: false, message: '缺少管理員憑證' }, { status: 401 }) };
  }

  const secret = process.env.PLATFORM_JWT_SECRET;
  if (!secret) {
    console.error('PLATFORM_JWT_SECRET is not configured');
    return { response: NextResponse.json({ success: false, message: '管理員驗證尚未配置' }, { status: 500 }) };
  }

  let userId: number;
  let username: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS512'] });
    userId = Number(payload.userId);
    username = typeof payload.username === 'string' ? payload.username.trim() : '';
  } catch (error) {
    console.error(error);
    return { response: NextResponse.json({ success: false, message: '管理員憑證無效或已過期' }, { status: 401 }) };
    // const payload = decodeJwt(token);
    // userId = Number(payload.userId);
    // username = typeof payload.username === 'string' ? payload.username.trim() : '';
  }

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { response: NextResponse.json({ success: false, message: '管理員憑證無效' }, { status: 401 }) };
  }

  let admin = await db.query.umsAdmin.findFirst({
    where: and(eq(umsAdmin.id, userId), eq(umsAdmin.status, 1)),
    columns: { id: true }
  });
  if (!admin && username) {
    admin = await db.query.umsAdmin.findFirst({
      where: and(eq(umsAdmin.username, username), eq(umsAdmin.status, 1)),
      columns: { id: true }
    });
  }
  if (!admin) {
    return { response: NextResponse.json({ success: false, message: '管理員不存在或已停用' }, { status: 403 }) };
  }

  return { admin };
}
