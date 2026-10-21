import { type SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { getDb } from '@/db';
import { ConfigError } from '@/lib/runtime-config/definitions';
import { POST } from './route';

vi.mock('@/app/api/feedback/features/admin/auth', () => ({ requireFeedbackAdmin: vi.fn() }));
vi.mock('@/db', () => ({ getDb: vi.fn(), withRuntimeScope: (handler: unknown) => handler }));
vi.mock('@/db/scheam', async () => import('@/db/scheam/external/platform_customer'));

const customer = {
  id: 12,
  custCode: 'C0012',
  custName: '=1+1',
  phone: '00123456789',
  email: 'customer@example.com',
  vipLevel: 2,
  registerTime: '2026-10-21 23:59:59',
  companyName: null
};
const orderBy = vi.fn();
const where = vi.fn((_condition: SQL | undefined) => ({ orderBy }));
const from = vi.fn(() => ({ where }));
const select = vi.fn((_columns: Record<string, unknown>) => ({ from }));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/customers/export', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireFeedbackAdmin).mockResolvedValue({ admin: { id: 1 } });
  // Keep the real SQL expressions while replacing only database execution.
  vi.mocked(getDb).mockResolvedValue({ select } as unknown as Awaited<ReturnType<typeof getDb>>);
  orderBy.mockResolvedValue([customer]);
});

describe('customer workbook export', () => {
  it('requires authentication before reading JSON or querying customers', async () => {
    vi.mocked(requireFeedbackAdmin).mockResolvedValue({ response: NextResponse.json({}, { status: 401 }) });
    const response = await POST(request(null));
    expect(response.status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    { custName: 1 },
    { vipLevel: '5' },
    { registerDateStart: '2026-02-30' },
    { registerDateStart: '2026-10-22', registerDateEnd: '2026-10-21' }
  ])('rejects invalid filters: %j', async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(getDb).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with a client error', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/admin/customers/export', { method: 'POST', body: '{' })
    );
    expect(response.status).toBe(400);
    expect(getDb).not.toHaveBeenCalled();
  });

  it('combines all filters with deletion exclusion and includes the whole end date', async () => {
    const response = await POST(
      request({
        custName: '  王%_\\  ',
        phone: '0012',
        email: 'example.com',
        vipLevel: '2',
        registerDateStart: '2026-10-01',
        registerDateEnd: '2026-10-21'
      })
    );
    expect(response.status).toBe(200);
    const condition: SQL | undefined = where.mock.calls[0]?.[0];
    expect(condition).toBeDefined();
    if (!condition) throw new Error('Missing query filters');
    const query = new MySqlDialect().sqlToQuery(condition);
    expect(query.sql).toContain('`platform_customer`.`is_deleted` = ?');
    expect(query.params).toEqual([
      0,
      '%王\\%\\_\\\\%',
      '%0012%',
      '%example.com%',
      2,
      '2026-10-01 00:00:00',
      '2026-10-21 23:59:59'
    ]);
  });

  it('returns a readable XLSX with text cells, labels, and no sensitive fields', async () => {
    const response = await POST(request({}));
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(response.headers.get('Content-Disposition')).toContain('filename="customers.xlsx"');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    const sheet = workbook.getWorksheet('客戶資料');
    expect(sheet?.rowCount).toBe(2);
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      '客戶 ID',
      '客戶編號',
      '客戶名稱',
      '電子郵件',
      '電話',
      '客戶類型',
      '註冊時間',
      '公司名稱'
    ]);
    expect(sheet?.getCell('C2').value).toBe('=1+1');
    expect(sheet?.getCell('C2').type).toBe(ExcelJS.ValueType.String);
    expect(sheet?.getCell('E2').value).toBe('00123456789');
    expect(sheet?.getCell('F2').value).toBe('黃金會員');
    expect(sheet?.getCell('H2').text).toBe('');
    expect(Object.keys(select.mock.calls[0]?.[0] ?? {})).not.toContain('password');
  });

  it('exports headers even when no customer matches', async () => {
    orderBy.mockResolvedValue([]);
    const response = await POST(request({ vipLevel: '', registerDateStart: '', registerDateEnd: '' }));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    expect(workbook.getWorksheet('客戶資料')?.rowCount).toBe(1);
  });

  it('returns a safe failure without exposing database errors', async () => {
    orderBy.mockRejectedValue(new Error('private database credentials'));
    const response = await POST(request({}));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('credentials');
  });

  it('preserves runtime configuration error status and message', async () => {
    vi.mocked(getDb).mockRejectedValue(new ConfigError('DATABASE_URL 尚未配置', 503));
    const response = await POST(request({}));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toBe('DATABASE_URL 尚未配置');
  });
});
