import { NextResponse } from 'next/server';
import { withRuntimeScope } from '@/db';
import { manualFailure, manualHeaders } from '@/lib/manual/api-response';
import { readManualPublic } from '@/lib/manual/service';
/** 匿名手册列表仅返回发布投影，绝不复用返回草稿的管理接口。 */
export const GET = withRuntimeScope(async () => {
  try {
    return NextResponse.json({ code: 200, data: await readManualPublic() }, { headers: manualHeaders });
  } catch (error) {
    return manualFailure(error);
  }
});
