import Link from '@/app/components/Link';

export default function BlogNotFound() {
  return (
    <main className="flex-1 container mx-auto px-4 py-20 text-center">
      <h1 className="text-xl font-bold mb-6">找不到此文章</h1>
      <Link scroll href="/blog" className="text-primary hover:underline">
        返回博客
      </Link>
    </main>
  );
}
