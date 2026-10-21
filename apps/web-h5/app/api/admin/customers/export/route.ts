import { type SQL, and, desc, eq, gte, like, lte } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { getDb, withRuntimeScope } from '@/db';
import { platformCustomer } from '@/db/scheam';
import { ConfigError } from '@/lib/runtime-config/definitions';

export const runtime = 'nodejs';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');
const optionalDate = z
  .union([z.literal(''), z.iso.date().refine(value => value >= '1000-01-01', '日期超出支援範圍')])
  .optional()
  .default('');
const filtersSchema = z
  .object({
    custName: optionalText(50),
    phone: optionalText(20),
    email: optionalText(50),
    vipLevel: z.union([z.literal(''), z.enum(['1', '2', '3', '4']), z.number().int().min(1).max(4)]).optional(),
    registerDateStart: optionalDate,
    registerDateEnd: optionalDate
  })
  .refine(
    value => !value.registerDateStart || !value.registerDateEnd || value.registerDateStart <= value.registerDateEnd,
    { message: '註冊開始日期不得晚於結束日期', path: ['registerDateEnd'] }
  );

function badRequest(message: string) {
  return NextResponse.json({ code: 400, message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
}

function failure(error: unknown) {
  return NextResponse.json(
    {
      code: error instanceof ConfigError ? error.status : 503,
      message: error instanceof ConfigError ? error.message : '客戶資料匯出失敗，請稍後重試'
    },
    { status: error instanceof ConfigError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}

// Treat LIKE wildcards in user input as literal characters.
function contains(value: string) {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

export const POST = withRuntimeScope(async (request: NextRequest) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('請提供有效的 JSON 查詢條件');
    }
    const parsed = filtersSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? '查詢條件無效');

    const filters = parsed.data;
    const conditions: SQL[] = [eq(platformCustomer.isDeleted, 0)];
    if (filters.custName) conditions.push(like(platformCustomer.custName, contains(filters.custName)));
    if (filters.phone) conditions.push(like(platformCustomer.phone, contains(filters.phone)));
    if (filters.email) conditions.push(like(platformCustomer.email, contains(filters.email)));
    if (filters.vipLevel) conditions.push(eq(platformCustomer.vipLevel, Number(filters.vipLevel)));
    if (filters.registerDateStart) {
      conditions.push(gte(platformCustomer.registerTime, `${filters.registerDateStart} 00:00:00`));
    }
    if (filters.registerDateEnd) {
      conditions.push(lte(platformCustomer.registerTime, `${filters.registerDateEnd} 23:59:59`));
    }

    const customers = await (
      await getDb()
    )
      .select({
        id: platformCustomer.id,
        custCode: platformCustomer.custCode,
        custName: platformCustomer.custName,
        email: platformCustomer.email,
        phone: platformCustomer.phone,
        vipLevel: platformCustomer.vipLevel,
        registerTime: platformCustomer.registerTime,
        companyName: platformCustomer.companyName
      })
      .from(platformCustomer)
      .where(and(...conditions))
      .orderBy(desc(platformCustomer.registerTime), desc(platformCustomer.id));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('客戶資料', { views: [{ state: 'frozen', ySplit: 1 }] });
    worksheet.columns = [
      { header: '客戶 ID', key: 'id', width: 16 },
      { header: '客戶編號', key: 'custCode', width: 24 },
      { header: '客戶名稱', key: 'custName', width: 24 },
      { header: '電子郵件', key: 'email', width: 36 },
      { header: '電話', key: 'phone', width: 24 },
      { header: '客戶類型', key: 'vipLevel', width: 16 },
      { header: '註冊時間', key: 'registerTime', width: 24 },
      { header: '公司名稱', key: 'companyName', width: 36 }
    ];
    const vipLabels: Record<number, string> = { 1: '註冊會員', 2: '黃金會員', 3: '白金會員', 4: '鑽石會員' };
    for (const customer of customers) {
      worksheet.addRow({
        ...customer,
        vipLevel: vipLabels[customer.vipLevel] ?? String(customer.vipLevel),
        companyName: customer.companyName ?? ''
      });
    }
    worksheet.getRow(1).font = { bold: true };
    worksheet.autoFilter = { from: 'A1', to: 'H1' };

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="customers.xlsx"; filename*=UTF-8''${encodeURIComponent('客戶資料.xlsx')}`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return failure(error);
  }
});
