import Link from '@/app/components/Link';
/** 隐藏与不存在的指南共用 404 说明，不泄露草稿或下架状态。 */
export default function MissingGuide() {
  return (
    <main className="container mx-auto flex-1 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">找不到此指南</h1>
      <Link href="/manual" className="block mt-4 text-primary">
        返回操作手冊
      </Link>
    </main>
  );
}
