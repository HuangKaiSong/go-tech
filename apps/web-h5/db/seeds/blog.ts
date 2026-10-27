import { type BlogArticle, articleSchema, defaultBlogSettings } from '@go-tech/blog-content/model';
import type { RichDocument, RichNode } from '@go-tech/manual-content/model';
import { publicationFields, publishTags, utcNow } from '../../lib/blog/service';
import { getDb } from '../index';
import { blogArticle, blogCategory, blogSettings } from '../scheam';
import { type BlogPost, blogCategories, blogPosts } from './blog-defaults';

/** 保留旧版章节、列表、配图及替代文字，转换为共用富文本契约。 */
const text = (value: string): RichNode => ({ type: 'paragraph', content: [{ type: 'text', text: value }] });
export function legacyBlogBody(sections: BlogPost['sections']): RichDocument {
  return {
    version: 1,
    doc: {
      type: 'doc',
      content: sections.flatMap(section => [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: section.heading }] } as RichNode,
        ...(section.image
          ? [
              {
                type: 'image',
                attrs: { src: section.image, alt: section.heading, width: 881, height: 391 }
              } as RichNode
            ]
          : []),
        ...(section.body.length > 1
          ? [
              {
                type: 'bulletList',
                content: section.body.map(value => ({ type: 'listItem', content: [text(value)] }))
              } as RichNode
            ]
          : section.body.map(text))
      ])
    }
  };
}
/** 单例占位与整批导入共用事务；再次运行不覆盖编辑结果，也不复活已删文章。 */
export async function seedBlog(database?: Awaited<ReturnType<typeof getDb>>) {
  return (database ?? (await getDb())).transaction(async tx => {
    const now = utcNow();
    const meta = {
      publishedVersion: 1,
      publishedAt: now,
      updatedAt: now,
      updatedBy: 0,
      isPublished: true,
      publicationState: 'published' as const
    };
    const result = await tx
      .insert(blogSettings)
      .ignore()
      .values({ id: 1, draft: defaultBlogSettings, published: defaultBlogSettings, ...meta });
    if (result[0].affectedRows !== 1) return false;
    const ids = new Map<string, number>();
    await Promise.all(
      blogCategories
        .filter(category => category !== '全部')
        .map(async (name, sortOrder) => {
          const draft = { name, sortOrder };
          const [row] = await tx
            .insert(blogCategory)
            .values({ draft, published: draft, ...meta })
            .$returningId();
          if (!row) throw new Error('博客分類初始化失敗');
          ids.set(name, row.id);
        })
    );
    await Promise.all(
      blogPosts.map(async (post, index) => {
        const categoryId = ids.get(post.category);
        if (!categoryId) throw new Error('博客文章分類無效');
        const draft: BlogArticle = articleSchema.parse({
          title: post.title,
          slug: post.slug,
          categoryId,
          excerpt: post.excerpt,
          cover: post.cover ?? '',
          coverAlt: post.cover ? post.title : '',
          body: legacyBlogBody(post.sections),
          tags: post.tags,
          displayDate: post.date,
          readMin: post.readMin,
          isFeatured: index === 0,
          sortOrder: 0
        });
        const [row] = await tx
          .insert(blogArticle)
          .values({
            draft,
            published: draft,
            slug: draft.slug,
            lockedSlug: draft.slug,
            categoryId,
            ...publicationFields(draft),
            ...meta
          })
          .$returningId();
        if (!row) throw new Error('博客文章初始化失敗');
        await publishTags(tx, row.id, draft.tags);
      })
    );
    return true;
  });
}
