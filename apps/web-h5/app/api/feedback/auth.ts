import { eq } from 'drizzle-orm';
import { decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { platformCustomer } from '@/db/scheam';
import { captureServerError } from '@/lib/browser-monitor/server';

export async function getFeedbackUser(request: Request) {
  const token = (await cookies()).get('GO_TECH_AUTH_TOKEN')?.value;
  if (!token) return null;

  try {
    // 解析token
    let payload;
    try {
      // 安全地解码 JWT
      payload = decodeJwt(token);
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      return null;
    }

    const userId = Number(payload?.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) return null;

    return (
      (await db.query.platformCustomer.findFirst({
        where: eq(platformCustomer.id, userId),
        columns: { id: true, custName: true }
      })) ?? null
    );
  } catch (error) {
    await captureServerError(error, {
      headers: request.headers,
      path: new URL(request.url).pathname,
      method: request.method,
      routeType: 'route'
    });
    return null;
  }
}
