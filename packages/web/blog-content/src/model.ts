import { richDocumentSchema, safeManualUrl } from '@go-tech/manual-content/model';
import { z } from 'zod';

export const BLOG_PAGE_SIZE = 12;
export const blogKinds = ['article', 'category', 'settings'] as const;
export type BlogKind = (typeof blogKinds)[number];
const id = z.number().int().positive().max(4_294_967_295);
const order = z.number().int().min(0).max(100_000);
export const normalizeTag = (value: string) => value.normalize('NFKC').trim().toLowerCase();
export const categorySchema = z.object({ name: z.string().trim().min(1).max(80), sortOrder: order }).strict();
const articleFields = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'URL 標識只可使用小寫英文字母、數字及連字號'),
    categoryId: id,
    excerpt: z.string().trim().max(2000),
    cover: z
      .string()
      .max(2000)
      .refine(value => !value || safeManualUrl(value, true), '封面地址無效'),
    coverAlt: z.string().trim().max(300),
    body: richDocumentSchema,
    tags: z
      .array(z.string().trim().min(1).max(80))
      .max(20)
      .refine(tags => tags.every(tag => normalizeTag(tag).length <= 160), '標籤規範化後過長')
      .transform(tags => [...new Map(tags.map(tag => [normalizeTag(tag), tag])).values()]),
    displayDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(value => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }, '展示日期無效'),
    readMin: z.number().int().min(1).max(999),
    isFeatured: z.boolean(),
    sortOrder: order
  })
  .strict();
export const articleSchema = articleFields.refine(
  value => !value.cover || Boolean(value.coverAlt),
  '請填寫封面替代文字'
);
export const settingsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000),
    searchPlaceholder: z.string().trim().min(1).max(100),
    promotionTitle: z.string().trim().min(1).max(200),
    promotionDescription: z.string().trim().max(1000)
  })
  .strict();
export type BlogArticle = z.infer<typeof articleSchema>;
export type BlogCategory = z.infer<typeof categorySchema>;
export type BlogSettings = z.infer<typeof settingsSchema>;
export type BlogDraft = BlogArticle | BlogCategory | BlogSettings;
export const draftSchemas = { article: articleSchema, category: categorySchema, settings: settingsSchema };
export const commandSchema = z
  .object({
    kind: z.enum(blogKinds),
    action: z.enum(['create', 'save', 'publish', 'unpublish', 'delete']),
    id: id.optional(),
    version: id.optional(),
    draft: z.unknown().optional()
  })
  .strict();
export type BlogCommand = z.infer<typeof commandSchema>;
export const publicationStates = ['draft', 'published', 'offline'] as const;
const recordSchema = <T extends z.ZodType>(draft: T) =>
  z.object({
    id,
    version: id,
    draft,
    published: draft.nullable(),
    publishedVersion: id.nullable(),
    lockedSlug: z.string().nullable(),
    publishedAt: z.string().nullable(),
    updatedAt: z.string(),
    updatedBy: z.number().int().nonnegative(),
    publicationState: z.enum(publicationStates)
  });
export const adminSchema = z.object({
  articles: z.array(recordSchema(articleSchema)),
  categories: z.array(recordSchema(categorySchema)),
  settings: z.array(recordSchema(settingsSchema))
});
export type BlogAdminData = z.infer<typeof adminSchema>;
export type BlogRecord<T = BlogDraft> = {
  draft: T;
  id: number;
  lockedSlug: string | null;
  publicationState: (typeof publicationStates)[number];
  published: T | null;
  publishedAt: string | null;
  publishedVersion: number | null;
  updatedAt: string;
  updatedBy: number;
  version: number;
};
export const querySchema = z.object({
  categoryId: z.coerce.number().int().positive().max(4_294_967_295).optional(),
  q: z.string().trim().max(50).default(''),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1)
});
export type BlogQuery = z.infer<typeof querySchema>;
export const summarySchema = articleFields.omit({ body: true }).extend({ id, category: z.string() });
export type BlogSummary = z.infer<typeof summarySchema>;
export const listSchema = z.object({
  settings: settingsSchema,
  categories: z.array(categorySchema.extend({ id })),
  articles: z.array(summarySchema),
  page: z.number().int().positive(),
  pageSize: z.literal(BLOG_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  query: querySchema
});
export type BlogList = z.infer<typeof listSchema>;
export const detailSchema = z.object({
  article: articleSchema.safeExtend({ id, category: z.string() }),
  settings: settingsSchema,
  related: z.array(summarySchema)
});
export type BlogDetail = z.infer<typeof detailSchema>;
export const defaultBlogSettings: BlogSettings = {
  title: '博客 Blog',
  description: '最新香港租務及人事條例、實務指南與 Go Techs 產品動態，助您管理更合規、更輕鬆。',
  searchPlaceholder: '搜尋文章，例如：外勞宿舍',
  promotionTitle: '用 Go Techs 讓合規管理更輕鬆',
  promotionDescription: '租約、單據、到期提醒一站管理'
};
