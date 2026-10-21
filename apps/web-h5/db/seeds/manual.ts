import { type RichNode, defaultManualSettings } from '@go-tech/manual-content/model';
import { eq } from 'drizzle-orm';
import { getDb } from '../index';
import { manualArticle, manualCategory, manualSettings } from '../scheam';
import { manualArticles, manualCategories } from './manual-defaults';

/** 将旧版步骤转换为富文本二级标题、段落与提示块，保留原指南内容和目录结构。 */
export function legacyManualBody(steps: { body: string; tip?: string; title: string }[]) {
  const content: RichNode[] = steps.flatMap(step => [
    { type: 'heading' as const, attrs: { level: 2 }, content: [{ type: 'text' as const, text: step.title }] },
    { type: 'paragraph' as const, content: [{ type: 'text' as const, text: step.body }] },
    ...(step.tip
      ? [
          {
            type: 'tip' as const,
            content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: step.tip }] }]
          }
        ]
      : [])
  ]);
  return { version: 1 as const, doc: { type: 'doc' as const, content } };
}

/** 首次以事务导入默认内容；单例已存在时整批跳过，不覆盖编辑结果或复活已删除的指南。 */
export async function seedManual(db = undefined as Awaited<ReturnType<typeof getDb>> | undefined) {
  const database = db ?? (await getDb());
  return database.transaction(async tx => {
    // 先 INSERT IGNORE 预留单例：重复初始化不写入；并发初始化等待首次事务提交后再判定。
    const result = await tx
      .insert(manualSettings)
      .ignore()
      .values({
        id: 1,
        draft: defaultManualSettings,
        published: defaultManualSettings,
        version: 1,
        publishedVersion: 1,
        updatedBy: 0,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        publishedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    if (result[0].affectedRows !== 1) return false;
    const [settings] = await tx.select().from(manualSettings).where(eq(manualSettings.id, 1));
    if (!settings) throw new Error('初始化失敗');
    const categoryIds = new Map<string, number>();
    await Promise.all(
      manualCategories.map(async (source, sortOrder) => {
        const draft = { name: source.name, desc: source.desc, icon: source.icon, sortOrder };
        const [row] = await tx
          .insert(manualCategory)
          .values({
            draft,
            published: draft,
            publishedVersion: 1,
            updatedBy: 0,
            publishedAt: settings.publishedAt,
            updatedAt: settings.updatedAt
          })
          .$returningId();
        if (!row) throw new Error('初始化主題失敗');
        categoryIds.set(source.id, row.id);
      })
    );
    await Promise.all(
      manualArticles.map(async (source, sortOrder) => {
        const categoryId = categoryIds.get(source.category);
        if (!categoryId) throw new Error('初始化指南分類無效');
        const draft = {
          categoryId,
          slug: source.slug,
          title: source.title,
          summary: source.summary,
          sortOrder,
          body: legacyManualBody(source.steps)
        };
        await tx.insert(manualArticle).values({
          draft,
          published: draft,
          publishedVersion: 1,
          updatedBy: 0,
          publishedAt: settings.publishedAt,
          updatedAt: settings.updatedAt,
          slug: source.slug,
          lockedSlug: source.slug,
          categoryId,
          publishedCategoryId: categoryId
        });
      })
    );
    return true;
  });
}
