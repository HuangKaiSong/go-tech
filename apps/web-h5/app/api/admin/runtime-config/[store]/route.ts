import { type NextRequest, NextResponse } from 'next/server';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { withRuntimeScope } from '@/db';
import { ConfigError, type ConfigStore } from '@/lib/runtime-config/definitions';
import { refreshPublicConfig } from '@/lib/runtime-config/events';
import { managedSnapshot, previewInfrastructure, saveConfiguration } from '@/lib/runtime-config/service';
export const runtime = 'nodejs';
type Context = { params: Promise<{ store: string }> };
function storeName(value: string): ConfigStore {
  if (value !== 'infrastructure' && value !== 'business') throw new ConfigError('配置分组不存在', 404);
  return value;
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      code: error instanceof ConfigError ? error.status : 503,
      message: error instanceof ConfigError ? error.message : '配置服务不可用，请检查存储和部署密钥'
    },
    { status: error instanceof ConfigError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
export const GET = withRuntimeScope(async (request: NextRequest, context: Context) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    return NextResponse.json(
      { code: 200, data: await managedSnapshot(storeName((await context.params).store)) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
});
export const POST = withRuntimeScope(async (request: NextRequest, context: Context) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    if (storeName((await context.params).store) !== 'infrastructure') throw new ConfigError('仅基础设施配置支持预览');
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('changes' in body)) throw new ConfigError('提交格式无效');
    return NextResponse.json(
      { code: 200, data: await previewInfrastructure(body.changes, auth.admin.id) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
});
export const PATCH = withRuntimeScope(async (request: NextRequest, context: Context) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    if (Number(request.headers.get('content-length')) > 131072) throw new ConfigError('配置提交过大', 413);
    const text = await request.text();
    if (text.length > 131072) throw new ConfigError('配置提交过大', 413);
    await saveConfiguration(storeName((await context.params).store), JSON.parse(text), {
      actor: String(auth.admin.id),
      adminId: auth.admin.id
    });
    await refreshPublicConfig();
    return NextResponse.json({ code: 200, message: '配置已生效' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return failure(error);
  }
});
