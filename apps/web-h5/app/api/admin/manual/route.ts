import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { requireFeedbackAdmin } from '@/app/api/feedback/features/admin/auth';
import { withRuntimeScope } from '@/db';
import { manualFailure, manualHeaders } from '@/lib/manual/api-response';
import { ManualError, mutateManual, readManualAdmin } from '@/lib/manual/service';
export const runtime = 'nodejs';
/** 管理员读取完整草稿及发布状态；不能将此接口用于匿名前台请求。 */
export const GET = withRuntimeScope(async (request: NextRequest) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    return NextResponse.json({ code: 200, data: await readManualAdmin() }, { headers: manualHeaders });
  } catch (error) {
    return manualFailure(error);
  }
});
/** 认证后处理带版本的管理操作，成功提交后刷新手册路由并返回最新编辑状态。 */
export const POST = withRuntimeScope(async (request: NextRequest) => {
  try {
    const auth = await requireFeedbackAdmin(request);
    if (auth.response) return auth.response;
    if (Number(request.headers.get('content-length')) > 1_000_000) throw new ManualError('提交內容過大', 413);
    // Content-Length 可能缺失或不可信，读取后再按 UTF-8 字节数限制富文本提交大小。
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 1_000_000) throw new ManualError('提交內容過大', 413);
    const savedId = await mutateManual(JSON.parse(text), auth.admin.id);
    revalidatePath('/[locale]/manual', 'layout');
    return NextResponse.json(
      { code: 200, message: '操作成功', savedId, data: await readManualAdmin() },
      { headers: manualHeaders }
    );
  } catch (error) {
    return manualFailure(error);
  }
});
