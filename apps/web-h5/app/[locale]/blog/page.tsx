import type { Metadata } from 'next';
import { connection } from 'next/server';
import { readBlogList } from '@/lib/blog/public';
import BlogContent from './blog-content';
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
async function load(props: Props) {
  const params = await props.searchParams;
  return readBlogList({ categoryId: params.categoryId, q: params.q, page: params.page });
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const data = await load(props);
    return { title: `${data.settings.title} | GO-TECHS`, description: data.settings.description };
  } catch {
    return { title: '博客 | GO-TECHS' };
  }
}
export default async function BlogPage(props: Props) {
  await connection();
  return <BlogContent initial={await load(props)} />;
}
