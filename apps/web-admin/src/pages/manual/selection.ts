import {
  type ManualAdminData,
  type ManualArticle,
  type ManualCategory,
  type ManualCommand,
  type ManualKind,
  type ManualRecord,
  type ManualSettings,
  defaultManualSettings,
  draftSchemas,
  emptyDocument
} from '@go-tech/manual-content/model';

/** 将内容种类与对应草稿类型绑定；baseline 用于判断尚未保存的本地修改。 */
export type Selection =
  | { baseline: string; draft: ManualArticle; kind: 'article'; record?: ManualRecord<ManualArticle> }
  | { baseline: string; draft: ManualCategory; kind: 'category'; record?: ManualRecord<ManualCategory> }
  | { baseline: string; draft: ManualSettings; kind: 'settings'; record?: ManualRecord<ManualSettings> };
/** 按种类选择后台编辑集合，避免将主题、指南和单例设置混用。 */
export function manualRows(data: ManualAdminData, kind: ManualKind): ManualRecord[] {
  switch (kind) {
    case 'article':
      return data.articles;
    case 'category':
      return data.categories;
    default:
      return data.settings;
  }
}
/** 构造独立编辑会话并记录保存基线；已存记录再次按契约收窄。 */
export function makeSelection(kind: ManualKind, data: ManualAdminData, row?: ManualRecord): Selection {
  if (kind === 'article') {
    const draft = row
      ? draftSchemas.article.parse(row.draft)
      : {
          categoryId: data.categories[0]?.id ?? 0,
          title: '',
          summary: '',
          slug: '',
          sortOrder: data.articles.length,
          body: emptyDocument
        };
    const record = row
      ? { ...row, draft, published: row.published ? draftSchemas.article.parse(row.published) : null }
      : undefined;
    return { kind, draft, record, baseline: JSON.stringify(draft) };
  }
  if (kind === 'category') {
    const draft = row
      ? draftSchemas.category.parse(row.draft)
      : { name: '', desc: '', icon: 'Rocket' as const, sortOrder: data.categories.length };
    const record = row
      ? { ...row, draft, published: row.published ? draftSchemas.category.parse(row.published) : null }
      : undefined;
    return { kind, draft, record, baseline: JSON.stringify(draft) };
  }
  const draft = row ? draftSchemas.settings.parse(row.draft) : defaultManualSettings;
  const record = row
    ? { ...row, draft, published: row.published ? draftSchemas.settings.parse(row.published) : null }
    : undefined;
  return { kind, draft, record, baseline: JSON.stringify(draft) };
}
/** 比较内容快照而非版本号，避免无内容变化的保存被误判为待发布修改。 */
export function stateLabel(row: ManualRecord) {
  if (!row.published) return '未發佈';
  return JSON.stringify(row.draft) !== JSON.stringify(row.published) ? '已發佈 · 有未發佈修改' : '已發佈';
}
/** 为会影响前台可见性或删除数据的操作提供明确确认文案。 */
export function mutationNotice(action: ManualCommand['action']) {
  switch (action) {
    case 'publish':
      return '確定將已儲存草稿發佈至前台？';
    case 'unpublish':
      return '確定下架？主題下架亦會隱藏其指南。';
    case 'delete':
      return '確定刪除此內容？已發佈內容也會立即移除。';
    default:
      return '';
  }
}
/** 区分草稿保存和真正发布的成功提示，避免操作人员误判线上状态。 */
export function mutationSuccess(action: ManualCommand['action']) {
  switch (action) {
    case 'publish':
      return '已發佈至前台';
    case 'unpublish':
      return '已下架';
    case 'delete':
      return '已刪除';
    default:
      return '草稿已儲存，尚未發佈';
  }
}

/** 数据库统一保存 UTC，后台按香港时区显示，避免直接展示无时区的原始时间。 */
export function manualTime(value: string): string {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
