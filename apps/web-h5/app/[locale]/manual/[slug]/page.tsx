import type { Metadata } from 'next';
import { manualArticles } from '../manual-data';
import ManualArticle from './manual-article';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = manualArticles.find(item => item.slug === slug);
  return { title: `${article?.title ?? '找不到此指南'} | GO-TECHS 操作手冊` };
}

export default async function ManualArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ManualArticle key={slug} slug={slug} />;
}
