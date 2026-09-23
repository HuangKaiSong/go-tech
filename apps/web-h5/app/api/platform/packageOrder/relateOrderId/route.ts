import { and, eq, isNotNull } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { packageOrder, platformTenant } from '@/db/scheam';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) return NextResponse.json({ success: false, message: 'Missing tenantId' }, { status: 400 });

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!token) {
    return NextResponse.json({ success: false, message: 'Missing authorization credentials' }, { status: 401 });
  }

  const result = await db
    .select({
      order_id: packageOrder.id,
      tenant_id: platformTenant.tenantId,
      relate_order: platformTenant.relateOrder
    })
    .from(platformTenant)
    .leftJoin(packageOrder, eq(packageOrder.orderNo, platformTenant.relateOrder))
    .where(and(isNotNull(platformTenant.tenantId), eq(platformTenant.tenantId, tenantId)));

  const tenant = result.at(-1);

  if (!tenant) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: tenant.order_id });
}
