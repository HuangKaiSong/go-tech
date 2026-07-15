/**
 * 迁移期临时 Mock 工具
 *
 * hr-pc-manager 原页面使用内置假数据 / Supabase，后端 REST 接口尚未提供。 迁移阶段先用本地 mock 让页面按真实
 * useTable 数据流渲染； 后端就绪后，把各模块 api.ts 中的 `mockPaginate(...)` 替换为 `request(...)` 即可，页面无需改动。
 */

/** 客户端分页，输出后端统一的分页结构。 */
export function mockPaginate<T>(
  records: T[],
  params: { current?: number | null; size?: number | null } = {}
): Api.Common.PaginatingQueryRecord<T> {
  const current = Number(params.current) || 1;
  const size = Number(params.size) || 10;
  const start = (current - 1) * size;

  return {
    current,
    records: records.slice(start, start + size),
    size,
    total: records.length
  };
}

/** 模拟网络延时，返回一个 resolved Promise。 */
export function mockResponse<T>(value: T, ms = 160): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), ms);
  });
}

/** 判断 keyword 是否命中任意字段（忽略大小写、空值）。 */
export function matchKeyword(keyword: string | null | undefined, ...fields: (string | null | undefined)[]) {
  if (!keyword) return true;

  const lower = keyword.toLowerCase();

  return fields.some(field => (field ?? '').toLowerCase().includes(lower));
}
