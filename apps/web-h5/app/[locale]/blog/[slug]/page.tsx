import { AlertCircle, ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from '@/app/components/Link';
import { blogPosts } from '@/lib/blog/posts';
import BlogTrialAction from '../blog-trial-action';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = blogPosts.find(p => p.slug === slug);
  return { title: `${article?.title ?? '找不到此文章'} | GO-TECHS 博客`, description: article?.excerpt };
}

const BlogPost = async ({ params }: Props) => {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) notFound();
  const related = blogPosts.filter(p => p.slug !== slug).slice(0, 3);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <main className="flex-1 pt-12 md:pt-11 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            scroll
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 返回博客
          </Link>
          <article>
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
              {post.category}
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground leading-tight">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readMin} 分鐘閱讀
              </span>
            </div>
            {post.cover && (
              <Image
                width={896}
                height={771}
                src={post.cover}
                alt={post.title}
                className="mt-8 w-full rounded-xl border border-border shadow-sm"
              />
            )}
            <p className="mt-8 text-lg text-foreground/80 leading-relaxed border-l-4 border-primary pl-4">
              {post.excerpt}
            </p>
            <div className="mt-10 space-y-8">
              {post.sections.map(s => (
                <section key={s.heading}>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">{s.heading}</h2>
                  {s.image && (
                    <Image
                      width={881}
                      height={391}
                      src={s.image}
                      alt={s.heading}
                      loading="lazy"
                      className="w-full rounded-xl border border-border shadow-sm mb-4"
                    />
                  )}
                  {s.body.length > 1 ? (
                    <ul className="space-y-2">
                      {s.body.map((b, i) => (
                        <li key={i} className="flex gap-2 text-foreground/80 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    s.body.map((b, i) => (
                      <p key={i} className="text-foreground/80 leading-relaxed mb-3">
                        {b}
                      </p>
                    ))
                  )}
                </section>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs rounded-full border border-border px-3 py-1 text-muted-foreground"
                >
                  <Tag className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 flex gap-2 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              本文內容僅供一般參考，不構成法律意見。具體要求請以政府最新公布及專業意見為準。
            </div>
            <div className="mt-10 rounded-2xl bg-primary/10 border border-primary/30 p-6 md:p-8 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">用 Go Techs 讓合規管理更輕鬆</h3>
              <p className="text-muted-foreground mb-5">租約、單據、到期提醒一站管理</p>
              <BlogTrialAction />
            </div>
          </article>

          <h3 className="mt-14 mb-4 text-xl font-bold text-foreground">更多文章</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map(p => (
              <Link
                key={p.slug}
                scroll
                href={`/blog/${p.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
              >
                <span className="text-[11px] text-primary font-semibold">{p.category}</span>
                <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
