'use client';

import { ArrowRight, BookOpen, Calendar, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import Link from '@/app/components/Link';
import { blogCategories, blogPosts } from '@/lib/blog/posts';

const Meta = ({ date, readMin }: { date: string; readMin: number }) => (
  <div className="flex items-center gap-4 text-xs text-muted-foreground">
    <span className="flex items-center gap-1">
      <Calendar className="w-3.5 h-3.5" />
      {date}
    </span>
    <span className="flex items-center gap-1">
      <Clock className="w-3.5 h-3.5" />
      {readMin} 分鐘閱讀
    </span>
  </div>
);

const Blog = () => {
  const [cat, setCat] = useState<string>('全部');
  const [q, setQ] = useState('');
  const list = blogPosts.filter(
    p => (cat === '全部' || p.category === cat) && (p.title + p.excerpt + p.tags.join('')).includes(q.trim())
  );
  const [featured, ...rest] = list;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <section className="pt-12 md:pt-11 pb-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 text-primary border border-primary/40 px-3 py-1 text-xs font-semibold mb-4">
            <BookOpen className="w-4 h-4" /> BLOG
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">博客 Blog</h1>
          <p className="text-lg text-background/75 max-w-2xl">
            最新香港租務及人事條例、實務指南與 Go Techs 產品動態，助您管理更合規、更輕鬆。
          </p>
          <div className="mt-6 relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="搜尋博客文章"
              value={q}
              onChange={e => setQ(e.target.value)}
              maxLength={50}
              placeholder="搜尋文章，例如：外勞宿舍"
              className="w-full h-11 rounded-full bg-background text-foreground pl-9 pr-4 text-sm"
            />
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 [scrollbar-width:none]">
          {blogCategories.map(c => (
            <button
              aria-pressed={cat === c}
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${cat === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {!featured ? (
          <p role="status" className="text-center text-muted-foreground py-20">
            沒有符合的文章
          </p>
        ) : (
          <>
            <Link
              scroll
              href={`/blog/${featured.slug}`}
              className="group grid md:grid-cols-5 gap-0 rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all mb-10"
            >
              <div className="md:col-span-2 min-h-48 bg-gradient-to-br from-primary to-primary/60 p-8 flex flex-col justify-between text-primary-foreground">
                <span className="text-xs font-semibold bg-background/20 rounded-full px-3 py-1 w-fit">
                  精選 · {featured.category}
                </span>
                <BookOpen className="w-16 h-16 opacity-80" />
              </div>
              <div className="md:col-span-3 p-6 md:p-8 bg-card">
                <Meta date={featured.date} readMin={featured.readMin} />
                <h2 className="mt-3 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-primary font-semibold">
                  閱讀全文 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(p => (
                <Link
                  scroll
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 w-fit">
                    {p.category}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{p.excerpt}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Meta date={p.date} readMin={p.readMin} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Blog;
