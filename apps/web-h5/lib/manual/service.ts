import {
  type ManualAdminData,
  type ManualCommand,
  type ManualDraft,
  type ManualKind,
  type ManualRecord,
  articleSchema,
  commandSchema,
  draftSchemas
} from '@go-tech/manual-content/model';
import { and, eq, or } from 'drizzle-orm';
import { cache } from 'react';
import { getDb } from '@/db';
import { manualArticle, manualCategory, manualSettings } from '@/db/scheam';
import { publishedManual } from './publication';

/** 可直接返回给操作人员的业务错误；其他异常统一转换为不含底层数据的服务错误。 */
export class ManualError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}
const tables = { category: manualCategory, article: manualArticle, settings: manualSettings };
type Database = Awaited<ReturnType<typeof getDb>>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** 数据库 JSON 同样视为外部输入，按表对应的契约重新收窄草稿及发布快照。 */
function parseRows<T extends ManualDraft>(kind: ManualKind, rows: ManualRecord[]) {
  return rows.map(row => ({
    ...row,
    draft: draftSchemas[kind].parse(row.draft) as T,
    published: row.published === null ? null : (draftSchemas[kind].parse(row.published) as T)
  }));
}
/** 读取后台完整编辑资料；调用方必须先完成管理员认证。 */
export async function readManualAdmin(): Promise<ManualAdminData> {
  const db = await getDb();
  const [categories, articles, settings] = await Promise.all([
    db.select().from(manualCategory),
    db.select().from(manualArticle),
    db.select().from(manualSettings)
  ]);
  return {
    categories: parseRows('category', categories),
    articles: parseRows('article', articles),
    settings: parseRows('settings', settings)
  };
}
/** 仅做请求内去重，不跨请求缓存，保证发布后的新请求立即读取最新快照。 */
export const readManualPublic = cache(async () => publishedManual(await readManualAdmin()));

/** 约束操作种类和版本参数，并禁止破坏首页设置单例。 */
function parseCommand(input: unknown) {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) throw new ManualError('操作參數無效');
  const command = parsed.data;
  if (command.action !== 'create' && (!command.id || !command.version)) throw new ManualError('缺少內容編號或版本');
  if (command.kind === 'settings' && ['create', 'delete', 'unpublish'].includes(command.action))
    throw new ManualError('首頁設定只支援儲存及發佈');
  return command;
}
/** 仅新增和保存接受正文输入；发布始终使用数据库里已保存的草稿。 */
function parseDraft(command: ManualCommand) {
  if (command.action !== 'create' && command.action !== 'save') return undefined;
  const validated = draftSchemas[command.kind].safeParse(command.draft);
  if (!validated.success) throw new ManualError(validated.error.issues[0]?.message ?? '內容格式無效');
  return validated.data;
}
/** 集中生成状态变更：保存只改草稿，发布复制快照，下架移除公开内容。 */
function publicationUpdate(
  command: ManualCommand,
  row: ManualRecord,
  { actor, draft }: { actor: number; draft?: ManualDraft }
) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const base = { version: row.version + 1, updatedBy: actor, updatedAt: now };
  switch (command.action) {
    case 'save':
      return { ...base, draft };
    case 'publish':
      return { ...base, published: row.draft, publishedAt: now, publishedVersion: row.version + 1 };
    case 'unpublish':
      return { ...base, published: null, publishedVersion: null, publishedAt: null };
    default:
      throw new ManualError('操作無效');
  }
}
/** 在同一事务内确认草稿主题存在且 URL 未被其他指南占用。 */
async function checkArticle(tx: Transaction, article: ReturnType<typeof articleSchema.parse>, existingId?: number) {
  const [category] = await tx
    .select({ id: manualCategory.id })
    .from(manualCategory)
    .where(eq(manualCategory.id, article.categoryId));
  if (!category) throw new ManualError('所屬主題不存在');
  const [duplicate] = await tx
    .select({ id: manualArticle.id })
    .from(manualArticle)
    .where(eq(manualArticle.slug, article.slug));
  if (duplicate && duplicate.id !== existingId) throw new ManualError('此 URL 標識已被使用', 409);
}
/** 新增未发布记录，返回真实自增 ID，避免后台误选并发创建的其他记录。 */
async function createEntry(
  tx: Transaction,
  command: ManualCommand,
  { actor, draft }: { actor: number; draft?: ManualDraft }
) {
  const { kind } = command;
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (!draft) throw new ManualError('缺少內容');
  if (kind === 'article') {
    const article = articleSchema.parse(draft);
    await checkArticle(tx, article);
    const [created] = await tx
      .insert(manualArticle)
      .values({ draft, updatedBy: actor, updatedAt, slug: article.slug, categoryId: article.categoryId })
      .$returningId();
    return created?.id;
  }
  const [created] = await tx.insert(manualCategory).values({ draft, updatedBy: actor, updatedAt }).$returningId();
  return created?.id;
}
/** 主题删除同时检查草稿和发布关联，避免改动草稿后误删仍在线上使用的主题。 */
async function deleteEntry(tx: Transaction, kind: ManualKind, row: ManualRecord) {
  if (kind === 'category') {
    const [reference] = await tx
      .select({ id: manualArticle.id })
      .from(manualArticle)
      .where(or(eq(manualArticle.categoryId, row.id), eq(manualArticle.publishedCategoryId, row.id)))
      .limit(1);
    if (reference) throw new ManualError('此主題仍有指南，請先遷移草稿及已發佈指南', 409);
  }
  const table = tables[kind];
  await tx.delete(table).where(and(eq(table.id, row.id), eq(table.version, row.version)));
}
/** 独立维护草稿/公开主题关联，并确保首次发布后的 URL 不会因下架而解锁。 */
async function updateArticle(
  tx: Transaction,
  command: ManualCommand,
  { actor, draft, row }: { actor: number; draft?: ManualDraft; row: ManualRecord }
) {
  const article = articleSchema.parse(draft ?? row.draft);
  if (row.lockedSlug && row.lockedSlug !== article.slug) throw new ManualError('已發佈指南的 URL 標識不可更改', 409);
  await checkArticle(tx, article, row.id);
  if (command.action === 'publish') {
    const [category] = await tx.select().from(manualCategory).where(eq(manualCategory.id, article.categoryId));
    if (!category?.published) throw new ManualError('請先發佈所屬主題');
  }
  const extra: { categoryId?: number; lockedSlug?: string; publishedCategoryId?: number | null; slug?: string } = {};
  switch (command.action) {
    case 'save':
      extra.slug = article.slug;
      extra.categoryId = article.categoryId;
      break;
    case 'publish':
      extra.publishedCategoryId = article.categoryId;
      extra.lockedSlug = article.slug;
      break;
    case 'unpublish':
      extra.publishedCategoryId = null;
      break;
    default:
      throw new ManualError('操作無效');
  }
  await tx
    .update(manualArticle)
    .set({ ...publicationUpdate(command, row, { actor, draft }), ...extra })
    .where(and(eq(manualArticle.id, row.id), eq(manualArticle.version, row.version)));
}
/** 事务化写入入口：先取全局单例锁，再检查记录版本，防止覆盖及主题删除竞态。 */
export async function mutateManual(input: unknown, actor: number) {
  const command = parseCommand(input);
  const draft = parseDraft(command);
  const db = await getDb();
  return db.transaction(async tx => {
    // 所有写入共用首页单例锁，避免删除主题与指南迁移在不同事务中交错。
    const [lock] = await tx
      .select({ id: manualSettings.id })
      .from(manualSettings)
      .where(eq(manualSettings.id, 1))
      .for('update');
    if (!lock) throw new ManualError('操作手冊尚未初始化，請先執行初始化腳本', 503);
    if (command.action === 'create') return createEntry(tx, command, { actor, draft });
    const table = tables[command.kind];
    const [row] = await tx
      .select()
      .from(table)
      .where(eq(table.id, command.id ?? 0))
      .for('update');
    if (!row) throw new ManualError('內容不存在', 404);
    if (row.version !== command.version) throw new ManualError('內容已被其他管理員修改，請重新載入後再編輯', 409);
    if (command.action === 'delete') return deleteEntry(tx, command.kind, row);
    if (command.kind === 'article') await updateArticle(tx, command, { row, actor, draft });
    else
      await tx
        .update(table)
        .set(publicationUpdate(command, row, { actor, draft }))
        .where(and(eq(table.id, row.id), eq(table.version, row.version)));
    return row.id;
  });
}
