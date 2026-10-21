import {
  type ManualAdminData,
  type ManualPublicData,
  articleSchema,
  categorySchema,
  settingsSchema
} from '@go-tech/manual-content/model';

/** 从后台记录投影出纯公开数据；主题关联也只使用发布快照，避免草稿迁移影响线上。 */
export function publishedManual(data: ManualAdminData): ManualPublicData {
  const settings = data.settings.find(item => item.published)?.published;
  if (!settings) throw new Error('操作手冊尚未初始化或發佈');
  const categories = data.categories
    .filter(row => row.published)
    .map(row => ({ ...categorySchema.parse(row.published), id: row.id }))
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const ids = new Set(categories.map(row => row.id));
  const articles = data.articles
    .filter(row => row.published)
    .map(row => ({ ...articleSchema.parse(row.published), id: row.id }))
    .filter(row => ids.has(row.categoryId))
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return { settings: settingsSchema.parse(settings), categories, articles };
}
