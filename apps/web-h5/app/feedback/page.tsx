import { and, asc, count, desc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { fbCategory, fbFeature, fbSubCategory } from '@/db/scheam';
import Header from '../components/Header';
import FeedbackContent from './FeedbackContent';

export const metadata: Metadata = {
  description: '分享並支持你對 GO-TECH 的想法',
  title: 'GO-TECH Feedback'
};

export default async function FeedbackPage() {
  const language = (await cookies()).get('GO_TECH_LANGUAGE')?.value || 'hk';
  const categories = await db.query.fbCategory.findMany({
    with: {
      subCategories: {
        columns: { id: true, name: true, sortOrder: true },
        orderBy: [asc(fbSubCategory.sortOrder)]
      }
    },
    orderBy: [asc(fbCategory.sortOrder)],
    columns: { id: true, name: true, icon: true, description: true }
  });

  // 查询每个分类下未完成的需求数量
  const catIds = categories.map(c => c.id);
  const featureCounts: Record<number, number> = {};
  if (catIds.length > 0) {
    const rows = await db
      .select({ categoryId: fbFeature.categoryId, cnt: count() })
      .from(fbFeature)
      .where(and(inArray(fbFeature.categoryId, catIds), ne(fbFeature.status, 'shipped'), isNull(fbFeature.deletedAt)))
      .groupBy(fbFeature.categoryId);
    for (const r of rows) {
      featureCounts[r.categoryId] = r.cnt;
    }
  }

  const categoriesWithCounts = categories.map(c => ({
    ...c,
    featureCount: featureCounts[c.id] ?? 0
  }));

  // 获取已经完成的历史记录
  const featureCompleted = await db
    .select()
    .from(fbFeature)
    .where(and(eq(fbFeature.status, 'shipped'), isNotNull(fbFeature.shippedAt), isNull(fbFeature.deletedAt)))
    .orderBy(desc(fbFeature.shippedAt));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F6', fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <FeedbackContent
        categoriesFromDB={categoriesWithCounts}
        featureCompleted={featureCompleted}
        language={language}
      />
    </div>
  );
}
