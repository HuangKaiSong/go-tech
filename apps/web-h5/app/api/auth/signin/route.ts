// import { httpClient } from '@/lib/http';
import { decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证请求体
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { token, tokenHead } = body;

    // 验证 token 是否存在
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    let payload;
    try {
      // 安全地解码 JWT
      payload = decodeJwt(token);
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // 验证 payload 是否有效
    if (!payload || !payload.exp) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // 设置过期时间
    const expiresAt = new Date(payload.exp * 1000);

    // 验证过期时间是否有效
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid expiration time in token' },
        { status: 400 }
      );
    }

    // 设置 Cookie
    cookieStore.set('GO_TECH_AUTH_TOKEN', token, {
      expires: expiresAt,
      path: '/',
    });

    // const user = await httpClient.get('/go-tech/platform/platformCustomer/getInfo')

    return NextResponse.json(
      { success: true, data: payload },
      { status: 200 } // 改为 200，因为有响应体
    );
  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}