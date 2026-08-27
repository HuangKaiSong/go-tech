import { and, asc, count, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { fbCategory, fbComment, fbFeature } from '@/db/scheam';
import type { Feature } from '../useFeedbackFeatures';
import CategoryContent from './CategoryContent';

/** 传给客户端组件的分类数据 */
export interface CategoryForPage {
  description: string | null;
  featureCount: number;
  icon: string | null;
  id: number;
  name: string;
  subCategories: { id: number; name: string; sortOrder: number }[];
}

const FeedbackCategoryPage = async ({ params }: { params: Promise<{ category: string }> }) => {
  const { category } = await params;
  const activeCat = decodeURIComponent(category);
  const language = (await cookies()).get('GO_TECH_LANGUAGE')?.value || 'hk';

  // 1. 查询所有分类（含子分类，按排序）
  const allCats = await db.query.fbCategory.findMany({
    with: { subCategories: { orderBy: [asc(fbCategory.sortOrder)] } },
    orderBy: [asc(fbCategory.sortOrder)]
  });

  // 2. 每个分类的需求数量（排除已完成的）
  const catIds = allCats.map(c => c.id);
  let countByCatId: Map<number, number> = new Map();

  if (catIds.length > 0) {
    const countRows = await db
      .select({ categoryId: fbFeature.categoryId, cnt: count() })
      .from(fbFeature)
      .where(and(inArray(fbFeature.categoryId, catIds), ne(fbFeature.status, 'shipped'), isNull(fbFeature.deletedAt)))
      .groupBy(fbFeature.categoryId);

    countByCatId = new Map(countRows.map(r => [r.categoryId, r.cnt]));
  }

  const categoriesForPage: CategoryForPage[] = allCats.map(c => ({
    description: c.description,
    featureCount: countByCatId.get(c.id) || 0,
    icon: c.icon,
    id: c.id,
    name: c.name,
    subCategories: c.subCategories.map(s => ({ id: s.id, name: s.name, sortOrder: s.sortOrder }))
  }));

  // 3. 校验当前分类是否存在
  const currentCat = allCats.find(c => c.name === activeCat);
  if (!currentCat) notFound();

  // 4. 查询当前分类下的所有需求（含 author、subCategory、comments(含author)、votes(含user)）
  const dbFeatures = await db.query.fbFeature.findMany({
    where: and(eq(fbFeature.categoryId, currentCat.id), isNull(fbFeature.deletedAt)),
    with: {
      author: { columns: { custName: true } },
      category: { columns: { name: true } },
      subCategory: { columns: { name: true } },
      comments: {
        where: and(eq(fbComment.isVisible, true), isNull(fbComment.deletedAt)),
        with: {
          author: { columns: { custName: true } }
        },
        orderBy: [asc(fbComment.createdAt)]
      },
      votes: {
        with: {
          user: { columns: { custName: true } }
        }
      }
    },
    orderBy: [desc(fbFeature.createdAt), desc(fbFeature.id)]
  });

  // 5. 映射为 serializable Feature 类型
  // Drizzle 嵌套 with + columns 的类型推断有限，用 any 桥接
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFeature = (row: any): Feature => ({
    id: String(row.id),
    title: row.title,
    description: row.description,
    author: row.author?.custName || 'Anonymous',
    category: row.category?.name || activeCat,
    subCategory: row.subCategory?.name || undefined,
    likes: row.likeCount ?? 0,
    likedBy: (row.votes || []).map((v: any) => v.user?.custName).filter(Boolean) as string[],
    comments: (row.comments || [])
      .filter((c: any) => !c.parentId || (row.comments || []).some((parent: any) => parent.id === c.parentId))
      .map((c: any) => ({
        id: String(c.id),
        author: c.isOfficial ? 'GO-TECH Manager' : c.author?.custName || 'Anonymous',
        content: c.content,
        createdAt: new Date(c.createdAt).toISOString(),
        isOfficial: c.isOfficial,
        parentId: c.parentId ? String(c.parentId) : null
      })),
    status: row.status as Feature['status'],
    createdAt: new Date(row.createdAt).toISOString(),
    shippedAt: row.shippedAt ? new Date(row.shippedAt).toISOString() : undefined,
    version: row.version || undefined
  });

  const allFeatures = dbFeatures.map(mapFeature);
  const featuresFromDB = allFeatures.filter(f => f.status !== 'shipped');
  const shippedFromDB = allFeatures.filter(f => f.status === 'shipped');

  return (
    <CategoryContent
      activeCat={activeCat}
      categoriesForPage={categoriesForPage}
      featuresFromDB={featuresFromDB}
      language={language}
      shippedFromDB={shippedFromDB}
    />
  );
};

export default FeedbackCategoryPage;
