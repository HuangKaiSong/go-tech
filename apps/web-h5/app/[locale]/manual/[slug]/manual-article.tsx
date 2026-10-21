'use client';

import { ManualBody, ManualContents, type ManualPublicData } from '@go-tech/manual-content';
import { ChevronRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import Link from '@/app/components/Link';

/** 详情及侧栏均来自同一发布集合；帮助反馈沿用本地交互，不写入内容管理数据。 */
const ManualArticle = ({ data, slug }: { data: ManualPublicData; slug: string }) => {
  const { articles: manualArticles, categories: manualCategories } = data;
  const a = manualArticles.find(x => x.slug === slug);
  const [voted, setVoted] = useState(false);
  const catName = manualCategories.find(c => c.id === a?.categoryId)?.name;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <main className="flex-1 pt-12 md:pt-11 pb-16 container mx-auto px-4">
        <nav aria-label="麵包屑" className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/manual" className="hover:text-primary">
            操作手冊
          </Link>
          {a && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{catName}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{a.title}</span>
            </>
          )}
        </nav>
        {!a ? (
          <p className="text-center py-20 text-muted-foreground">找不到此指南</p>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-5">
                {manualCategories.map(c => (
                  <div key={c.id}>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{c.name}</p>
                    {manualArticles
                      .filter(x => x.categoryId === c.id)
                      .map(x => (
                        <Link
                          key={x.slug}
                          href={`/manual/${x.slug}`}
                          className={`block text-sm py-1 pl-3 border-l-2 ${x.slug === a.slug ? 'border-primary text-primary font-semibold' : 'border-border text-foreground/70 hover:text-primary'}`}
                        >
                          {x.title}
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </aside>
            <article className="lg:col-span-3 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{a.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{a.summary}</p>
              <ManualContents body={a.body} />
              <ManualBody body={a.body} />
              <div className="mt-12 border-t border-border pt-6 flex items-center gap-3">
                {voted ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    感謝您的意見！
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">這篇指南有幫助嗎？</p>
                    <button
                      aria-label="有幫助"
                      onClick={() => setVoted(true)}
                      className="p-2 rounded-full border border-border hover:border-primary"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      aria-label="沒有幫助"
                      onClick={() => setVoted(true)}
                      className="p-2 rounded-full border border-border hover:border-primary"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManualArticle;
