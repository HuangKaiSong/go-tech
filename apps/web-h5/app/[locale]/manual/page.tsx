import type { Metadata } from 'next';
import { connection } from 'next/server';
import { readManualPublic } from '@/lib/manual/service';
import ManualContent from './manual-content';

export const metadata: Metadata = { title: '操作手冊 | GO-TECHS' };

/** 按请求读取数据库发布快照；存储异常交给手册错误边界处理，不回退静态内容。 */
export default async function ManualPage() {
  await connection();
  return <ManualContent data={await readManualPublic()} />;
}
