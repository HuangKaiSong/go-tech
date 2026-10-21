import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { readManualPublic } from '@/lib/manual/service';
import ManualArticle from './manual-article';

/** SEO 标题也使用发布快照，避免草稿标题进入页面元数据。 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const article = (await readManualPublic()).articles.find(item => item.slug === slug);
  return { title: `${article?.title ?? '找不到此指南'} | GO-TECHS 操作手冊` };
}

/** 从可见发布集合确认指南存在；未发布、已下架或主题隐藏时返回 404。 */
export default async function ManualArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  const data = await readManualPublic();
  if (!data.articles.some(item => item.slug === slug)) notFound();
  return <ManualArticle key={slug} slug={slug} data={data} />;
}
