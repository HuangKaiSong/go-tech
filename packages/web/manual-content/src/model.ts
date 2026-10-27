import { z } from 'zod';

/** 允许后台选择的主题图标；固定白名单避免引入任意组件名称。 */
export const manualIcons = ['Rocket', 'Building2', 'Wallet', 'Wrench', 'Users', 'CreditCard'] as const;
export type ManualIcon = (typeof manualIcons)[number];
export const manualKinds = ['category', 'article', 'settings'] as const;
export type ManualKind = (typeof manualKinds)[number];
/** 编辑器、服务端校验及前台渲染共同支持的富文本节点白名单。 */
export const manualNodeTypes = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'hardBreak',
  'horizontalRule',
  'image',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
  'tip'
] as const;
/** 受控的 Tiptap JSON 节点；属性和父子关系仍需运行时校验，不能只依赖 TypeScript。 */
export interface RichNode {
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: { attrs?: Record<string, unknown>; type: 'bold' | 'italic' | 'link' | 'strike' | 'underline' }[];
  text?: string;
  type: (typeof manualNodeTypes)[number];
}
/** 持久化正文封装；version 是内容格式版本，与数据库记录的并发版本无关。 */
export interface RichDocument {
  doc: RichNode;
  version: 1;
}

/** 只允许站内路径和无凭证的 HTTP(S) 地址；正文链接还可使用本页锚点，图片不可使用锚点。 */
export function safeManualUrl(value: string, image = false): boolean {
  if (
    !value ||
    value !== value.trim() ||
    /[\s\\]/u.test(value) ||
    [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (!image && /^#[a-zA-Z0-9_-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
  } catch {
    return false;
  }
}

const record = z.record(z.string(), z.unknown());
/** 递归解析字段形状；解析前先执行非递归上限检查，避免恶意嵌套耗尽调用栈。 */
const nodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z
    .object({
      type: z.enum(manualNodeTypes),
      text: z.string().max(100_000).optional(),
      attrs: record.optional(),
      marks: z
        .array(
          z
            .object({ type: z.enum(['bold', 'italic', 'strike', 'underline', 'link']), attrs: record.optional() })
            .strict()
        )
        .max(10)
        .optional(),
      content: z.array(nodeSchema).max(2000).optional()
    })
    .strict()
);

/** 提取标题的可见文字，供目录使用，不把正文当作 HTML 解析。 */
export function textOf(node: RichNode): string {
  return node.text ?? node.content?.map(textOf).join('') ?? '';
}

/** 图片尺寸统一采用正整数像素，限制超大或非数值属性，供保存与渲染共同使用。 */
export const manualImageSizeLimit = 10_000;
export function imageDimension(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= manualImageSizeLimit
    ? value
    : undefined;
}

function validImage(attrs: Record<string, unknown>): boolean {
  const dimensions = ['width', 'height'].every(
    key => attrs[key] === undefined || attrs[key] === null || imageDimension(attrs[key]) !== undefined
  );
  return (
    dimensions &&
    typeof attrs.src === 'string' &&
    safeManualUrl(attrs.src, true) &&
    typeof attrs.alt === 'string' &&
    Boolean(attrs.alt.trim()) &&
    attrs.alt.length <= 500
  );
}

/** 按节点类型限制可持久化属性，并强制图片替代文字及受支持的标题层级。 */
function validAttributes(node: RichNode): boolean {
  const attrs = node.attrs ?? {};
  const allowed: Record<string, string[]> = {
    heading: ['level'],
    image: ['src', 'alt', 'title', 'width', 'height'],
    orderedList: ['start', 'type'],
    tableCell: ['colspan', 'rowspan', 'colwidth'],
    tableHeader: ['colspan', 'rowspan', 'colwidth']
  };
  if (Object.keys(attrs).some(key => !(allowed[node.type] ?? []).includes(key))) return false;
  switch (node.type) {
    case 'heading':
      return attrs.level === 2 || attrs.level === 3;
    case 'image':
      return validImage(attrs);
    case 'orderedList':
      return attrs.start === undefined || (Number.isSafeInteger(attrs.start) && Number(attrs.start) >= 1);
    case 'tableCell':
    case 'tableHeader':
      return validCell(attrs);
    default:
      return true;
  }
}
/** 限制表格跨度和列宽，拒绝超大数值及与编辑器不兼容的单元格属性。 */
function validCell(attrs: Record<string, unknown>): boolean {
  for (const key of ['colspan', 'rowspan'])
    if (
      attrs[key] !== undefined &&
      (!Number.isInteger(attrs[key]) || Number(attrs[key]) < 1 || Number(attrs[key]) > 20)
    )
      return false;
  return (
    attrs.colwidth === undefined ||
    attrs.colwidth === null ||
    (Array.isArray(attrs.colwidth) && attrs.colwidth.every(x => Number.isInteger(x) && x >= 1 && x <= 2000))
  );
}
/** 格式标记不接受任意属性；链接仅保留已知配置且再次校验目标地址。 */
function validMarks(node: RichNode): boolean {
  return (node.marks ?? []).every(mark => {
    if (mark.type !== 'link') return !mark.attrs || Object.keys(mark.attrs).length === 0;
    const attrs = mark.attrs ?? {};
    return (
      typeof attrs.href === 'string' &&
      safeManualUrl(attrs.href) &&
      Object.keys(attrs).every(key => ['href', 'target', 'rel', 'class'].includes(key))
    );
  });
}
/** 先以显式栈限制原始 JSON 的深度和规模，再交给递归 schema 处理。 */
function boundedInput(value: unknown): boolean {
  const stack = [{ value, depth: 0 }];
  let count = 0;
  while (stack.length) {
    const entry = stack.pop();
    if (!entry) break;
    count += 1;
    if (entry.depth > 50 || count > 60000) return false;
    if (entry.value && typeof entry.value === 'object')
      for (const child of Object.values(entry.value)) stack.push({ value: child, depth: entry.depth + 1 });
  }
  return true;
}
/** 校验父子节点关系和整体节点上限，拒绝字段合法但无法安全渲染的文档树。 */
function validTree(root: RichNode): boolean {
  let count = 0;
  const blocks = [
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'blockquote',
    'horizontalRule',
    'image',
    'table',
    'tip'
  ];
  const allowed: Record<string, string[]> = {
    doc: blocks,
    paragraph: ['text', 'hardBreak'],
    heading: ['text', 'hardBreak'],
    bulletList: ['listItem'],
    orderedList: ['listItem'],
    listItem: blocks,
    blockquote: blocks,
    tip: ['paragraph'],
    table: ['tableRow'],
    tableRow: ['tableCell', 'tableHeader'],
    tableCell: blocks,
    tableHeader: blocks
  };
  const visit = (node: RichNode, depth: number): boolean => {
    count += 1;
    if (count > 5000 || depth > 20 || !validAttributes(node) || !validMarks(node)) return false;
    if (node.type === 'text') return typeof node.text === 'string' && !node.content?.length;
    if (node.text !== undefined) return false;
    return (node.content ?? []).every(
      child => (allowed[node.type] ?? []).includes(child.type) && visit(child, depth + 1)
    );
  };
  return root.type === 'doc' && visit(root, 0);
}

/** 正文统一入口：先限制输入规模，再解析节点，最后验证属性及树结构。 */
export const richDocumentSchema = z
  .unknown()
  .refine(boundedInput, '正文過大或層次過深')
  .pipe(
    z
      .object({ version: z.literal(1), doc: nodeSchema })
      .strict()
      .refine(value => validTree(value.doc), '正文結構、圖片說明或連結無效')
  );
const order = z.number().int().min(0).max(100_000);
/** 主题草稿和发布快照使用相同契约，排序在发布后才影响前台。 */
export const categorySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    desc: z.string().trim().max(500),
    icon: z.enum(manualIcons),
    sortOrder: order
  })
  .strict();
/** 指南的完整内容契约；categoryId 属于当前快照，不能用草稿主题替代发布主题。 */
export const articleSchema = z
  .object({
    categoryId: z.number().int().positive(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().max(1000),
    sortOrder: order,
    body: richDocumentSchema
  })
  .strict();
/** 只管理首页文案；支援按钮的固定业务目标不开放为任意 URL。 */
export const settingsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    subtitle: z.string().trim().max(500),
    searchPlaceholder: z.string().trim().max(100),
    supportTitle: z.string().trim().min(1).max(100),
    supportDescription: z.string().trim().max(500),
    supportButton: z.string().trim().min(1).max(80)
  })
  .strict();
export type ManualCategory = z.infer<typeof categorySchema>;
export type ManualArticle = z.infer<typeof articleSchema>;
export type ManualSettings = z.infer<typeof settingsSchema>;
export type ManualDraft = ManualCategory | ManualArticle | ManualSettings;
export const draftSchemas = { category: categorySchema, article: articleSchema, settings: settingsSchema };
/** 管理接口的操作信封；是否需要正文、ID 和版本由服务层按操作进一步检查。 */
export const commandSchema = z
  .object({
    kind: z.enum(manualKinds),
    action: z.enum(['create', 'save', 'publish', 'unpublish', 'delete']),
    id: z.number().int().positive().optional(),
    version: z.number().int().positive().optional(),
    draft: z.unknown().optional()
  })
  .strict();
export type ManualCommand = z.infer<typeof commandSchema>;
/** 后台编辑记录；draft 和 published 独立保存，并记录并发版本及最近操作信息。 */
export interface ManualRecord<T = ManualDraft> {
  /** 当前可编辑内容；保存时不改变 published。 */
  draft: T;
  id: number;
  /** 指南首次发布时固定的 URL；其余记录类型为空。 */
  lockedSlug: string | null;
  /** 当前公开快照；NULL 表示未发布或已下架。 */
  published: T | null;
  /** 当前快照的 UTC 发布时间，下架时为空。 */
  publishedAt: string | null;
  /** 发布时对应的记录版本，不随草稿保存而变化。 */
  publishedVersion: number | null;
  /** 最近修改的 UTC 时间，后台展示时转换为香港时间。 */
  updatedAt: string;
  /** 最近修改的管理员 ID，0 表示初始化数据。 */
  updatedBy: number;
  /** 每次写入递增的并发控制版本，编辑提交时必须回传。 */
  version: number;
}
/** 仅限管理员的完整编辑集合，包含未发布内容。 */
export interface ManualAdminData {
  articles: ManualRecord<ManualArticle>[];
  categories: ManualRecord<ManualCategory>[];
  settings: ManualRecord<ManualSettings>[];
}
/** 匿名前台专用的发布投影，不包含任何草稿、管理员信息或编辑状态。 */
export interface ManualPublicData {
  articles: (ManualArticle & { id: number })[];
  categories: (ManualCategory & { id: number })[];
  settings: ManualSettings;
}
/** 仅供首次初始化或后台新表单构造使用，不作为数据库异常时的前台兜底。 */
export const defaultManualSettings: ManualSettings = {
  title: 'Go Techs 操作手冊',
  subtitle: '一步一步教您使用租務系統及 GO-HRM',
  searchPlaceholder: '搜尋操作指南，例如：自動收租',
  supportTitle: '找不到答案？',
  supportDescription: '歡迎向我們提出問題或需求',
  supportButton: '聯絡支援'
};
export const emptyDocument: RichDocument = { version: 1, doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
/** 按文档遍历顺序生成目录锚点；不使用标题文字作为 ID，避免同名标题冲突。 */
export function headingEntries(doc: RichDocument) {
  let index = 0;
  const entries: { id: string; level: number; text: string }[] = [];
  const walk = (node: RichNode) => {
    if (node.type === 'heading') {
      entries.push({ id: `manual-heading-${index}`, text: textOf(node), level: Number(node.attrs?.level) });
      index += 1;
    }
    node.content?.forEach(walk);
  };
  walk(doc.doc);
  return entries;
}

const rowSchema = <T extends z.ZodType>(draft: T) =>
  z.object({
    id: z.number(),
    version: z.number(),
    draft,
    published: draft.nullable(),
    publishedVersion: z.number().nullable(),
    publishedAt: z.string().nullable(),
    updatedAt: z.string(),
    updatedBy: z.number(),
    lockedSlug: z.string().nullable()
  });
/** 后台读取接口的响应校验，防止将格式异常的服务器数据直接放进编辑器。 */
export const manualAdminSchema = z.object({
  categories: z.array(rowSchema(categorySchema)),
  articles: z.array(rowSchema(articleSchema)),
  settings: z.array(rowSchema(settingsSchema))
});
