'use client';

import type { ManualPublicData } from '@go-tech/manual-content/model';
import {
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  LifeBuoy,
  Rocket,
  Search,
  Users,
  Wallet,
  Wrench
} from 'lucide-react';
import { useState } from 'react';
import Link from '@/app/components/Link';

const icons = { Rocket, Building2, Wallet, Wrench, Users, CreditCard };

/** 只对服务端传入的发布内容做本地筛选，不在浏览器请求管理接口或加载草稿。 */
const Manual = ({ data }: { data: ManualPublicData }) => {
  const { articles: manualArticles, categories: manualCategories, settings } = data;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<number | null>(null);
  const term = q.trim();
  const list = manualArticles.filter(a => (!cat || a.categoryId === cat) && (a.title + a.summary).includes(term));
  const categoryName = manualCategories.find(c => c.id === cat)?.name;
  const listTitle = term ? `「${term}」的搜尋結果` : (categoryName ?? '熱門指南');

  return (
    <div className="flex-1 flex flex-col bg-background">
      <section className="pt-12 md:pt-11 pb-14 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">{settings.title}</h1>
          <p className="opacity-90 mb-6">{settings.subtitle}</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="搜尋操作指南"
              value={q}
              onChange={e => setQ(e.target.value)}
              maxLength={50}
              placeholder={settings.searchPlaceholder}
              className="w-full h-12 rounded-full bg-background text-foreground pl-12 pr-4 shadow-lg"
            />
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-10">
        {!term && (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-5">按主題瀏覽</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {manualCategories.map(c => {
                const Icon = icons[c.icon];
                const count = manualArticles.filter(a => a.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    aria-pressed={cat === c.id}
                    onClick={() => setCat(cat === c.id ? null : c.id)}
                    className={`text-left flex gap-4 rounded-xl border p-5 bg-card transition-all hover:shadow-lg hover:border-primary ${cat === c.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  >
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{c.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                      <p className="text-xs text-primary mt-2">{count} 篇指南</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <h2 className="text-2xl font-bold text-foreground mb-5">{listTitle}</h2>
        {list.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">找不到相關指南</p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {list.map(a => (
              <Link
                key={a.slug}
                href={`/manual/${a.slug}`}
                className="group flex items-center gap-4 p-4 hover:bg-muted transition-colors"
              >
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.summary}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-muted p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-primary" />
            <div>
              <p className="font-bold text-foreground">{settings.supportTitle}</p>
              <p className="text-sm text-muted-foreground">{settings.supportDescription}</p>
            </div>
          </div>
          <Link href="/feedback" className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold">
            {settings.supportButton}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Manual;
