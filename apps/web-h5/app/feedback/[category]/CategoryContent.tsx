'use client';

import { Button, Input } from '@go-tech-frontend/ui';
import { ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, LoaderCircle, MessageCircle, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import { SmallOfficialAvatar, SmallUserAvatar } from '@/app/components/feedback/Avatars';
import NewPostDialog from '@/app/components/feedback/NewPostDialog';
import Turnstile from '@/app/components/feedback/turnstile';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { SERIF, statusMeta } from '../data';
import { formatDate, maskName, orderCommentsByThread, useFeedbackFeatures } from '../useFeedbackFeatures';
import type { Feature } from '../useFeedbackFeatures';
import type { CategoryForPage } from './page';

interface Props {
  activeCat: string;
  categoriesForPage: CategoryForPage[];
  featuresFromDB: Feature[];
  language: string;
  shippedFromDB: Feature[];
}

const CategoryContent = ({ activeCat, categoriesForPage, featuresFromDB, language, shippedFromDB }: Props) => {
  const router = useProgressRouter();
  const { addComment, addFeature, features, requireLogin, toggleLike } = useFeedbackFeatures(activeCat, featuresFromDB);
  const { user } = useAuth();

  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot');
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [deptSwitchOpen, setDeptSwitchOpen] = useState(false);
  const [innerSearch, setInnerSearch] = useState('');
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [openReply, setOpenReply] = useState<string | null>(null);
  const reviewingCommentRef = useRef(false);
  const [reviewingCommentId, setReviewingCommentId] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const replyText = useBatchTranslation('回覆');
  const searchPlaceholder = useBatchTranslation(`在「${activeSub || activeCat}」中搜尋建議…`);
  const verificationRequired = useBatchTranslation('請先完成人機驗證');

  const meta = useMemo(() => categoriesForPage.find(c => c.name === activeCat), [categoriesForPage, activeCat]);

  useEffect(() => {
    setActiveSub(null);
    setInnerSearch('');
    setTab('active');
    setDeptSwitchOpen(false);
  }, [activeCat]);

  /** 子分类列表（从 categoriesForPage 计算） */
  const subNames = useMemo(() => {
    const cat = categoriesForPage.find(c => c.name === activeCat);
    return cat ? cat.subCategories.map(s => s.name) : [];
  }, [categoriesForPage, activeCat]);

  /** 服务端提供所有分类计数；当前分类使用本地列表，以便新增后即时更新 */
  const countByCat = Object.fromEntries(categoriesForPage.map(category => [category.name, category.featureCount]));
  countByCat[activeCat] = features.filter(
    feature => feature.status !== 'shipped' && feature.category === activeCat
  ).length;

  /** 每个子分类的需求计数 */
  const countBySub = useMemo(() => {
    const map: Record<string, number> = {};
    features
      .filter(f => f.status !== 'shipped' && f.category === activeCat)
      .forEach(f => {
        if (f.subCategory) map[f.subCategory] = (map[f.subCategory] || 0) + 1;
      });
    return map;
  }, [features, activeCat]);

  /** 当前分类的活跃需求（筛选+排序） */
  const active = useMemo(() => {
    let arr = features.filter(f => f.status !== 'shipped' && f.category === activeCat);
    if (activeSub) arr = arr.filter(f => f.subCategory === activeSub);
    const q = innerSearch.trim().toLowerCase();
    if (q) {
      arr = arr.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return [...arr].toSorted((a, b) => {
      if (sortBy === 'hot') return b.likes - a.likes;

      const createdAtDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return createdAtDiff || Number(b.id) - Number(a.id);
    });
  }, [features, sortBy, activeCat, activeSub, innerSearch]);

  /** 已完成需求历史（从服务端 shippedFromDB 筛选） */
  const historyForCat = useMemo(() => {
    let arr = shippedFromDB.filter(f => f.category === activeCat);
    if (activeSub) arr = arr.filter(f => f.subCategory === activeSub);
    const q = innerSearch.trim().toLowerCase();
    if (q) {
      arr = arr.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return arr;
  }, [shippedFromDB, activeCat, activeSub, innerSearch]);

  const sendComment = async (id: string) => {
    if (reviewingCommentRef.current) return;
    if (!requireLogin()) return;
    const text = (commentDraft[id] || '').trim();
    if (!text) return;
    if (!turnstileToken) {
      toast.warning(verificationRequired);
      return;
    }
    reviewingCommentRef.current = true;
    setReviewingCommentId(id);
    try {
      const commentAdded = await addComment(id, text, turnstileToken);
      setTurnstileToken('');
      if (commentAdded) {
        setCommentDraft(d => ({ ...d, [id]: '' }));
        setOpenReply(null);
        return;
      }
      setTurnstileResetKey(key => key + 1);
    } finally {
      reviewingCommentRef.current = false;
      setReviewingCommentId(null);
    }
  };

  /** 传给 NewPostDialog 的分类数据 */
  const dialogCategories = useMemo(
    () => categoriesForPage.map(c => ({ name: c.name, subNames: c.subCategories.map(s => s.name) })),
    [categoriesForPage]
  );

  if (!meta) return null;

  const renderIdeaRow = (f: Feature) => {
    const currentUser = user?.nickname ?? '';
    const liked = Boolean(currentUser) && f.likedBy.includes(currentUser);
    const replyOpen = openReply === f.id;

    return (
      <article key={f.id} className="flex gap-5 md:gap-7 py-8 border-b border-stone-200 last:border-b-0">
        <div className="shrink-0 w-16 text-center">
          <button
            onClick={() => toggleLike(f.id)}
            className={`w-16 py-2 rounded-md border transition-colors ${
              liked
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-white border-stone-200 text-stone-900 hover:border-stone-900'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5 mx-auto mb-0.5" strokeWidth={2.5} />
            <span className="block text-xl leading-none font-semibold">{f.likes}</span>
            <span className="block text-[9px] uppercase tracking-widest mt-1 opacity-70">
              <DynamicText text="讚好" />
            </span>
          </button>
          <span
            className={`mt-2 inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${statusMeta[f.status].badge}`}
          >
            <DynamicText text={statusMeta[f.status].label} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            style={SERIF}
            className="text-2xl md:text-[26px] leading-snug text-stone-900 hover:text-primary transition-colors cursor-default"
          >
            <span>{f.title}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 mb-3 text-xs text-stone-500">
            <span className="text-primary font-medium">{maskName(f.author)}</span>
            <span className="text-stone-300">·</span>
            <span>{formatDate(f.createdAt, language)}</span>
            <span className="text-stone-300">·</span>
            <span className="uppercase tracking-widest text-[10px]">
              <DynamicText text={f.category} />
            </span>
          </div>
          <p className="text-stone-600 text-[15px] leading-relaxed">
            <span>{f.description}</span>
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                if (!requireLogin()) return;
                setOpenReply(replyOpen ? null : f.id);
                setTurnstileToken('');
                setTurnstileResetKey(key => key + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 bg-white text-xs text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                {f.comments.length} <DynamicText text="回覆" />
              </span>
            </button>
          </div>

          {f.comments.length > 0 && (
            <div className="mt-5 space-y-4">
              {orderCommentsByThread(f.comments).map(c => (
                <div
                  key={c.id}
                  className={`flex gap-3 items-start ${c.parentId ? 'ml-8 border-l border-stone-200 pl-4 md:ml-12' : ''}`}
                >
                  {c.isOfficial ? <SmallOfficialAvatar /> : <SmallUserAvatar />}
                  <div
                    className={`flex-1 min-w-0 border rounded-md px-4 py-3 ${
                      c.isOfficial ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                      <span className={`font-semibold text-xs ${c.isOfficial ? 'text-primary' : 'text-stone-900'}`}>
                        {c.isOfficial ? c.author : maskName(c.author)}
                      </span>
                      {c.isOfficial && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                          <DynamicText text="官方回覆" />
                        </span>
                      )}
                      <span className={`text-[11px] ${c.isOfficial ? 'text-stone-400' : 'text-stone-500'}`}>
                        {formatDate(c.createdAt, language)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${c.isOfficial ? 'text-stone-200' : 'text-stone-700'}`}>
                      <span>{c.content}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyOpen && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  disabled={reviewingCommentId === f.id}
                  placeholder={`${replyText} ${maskName(f.author)}...`}
                  value={commentDraft[f.id] || ''}
                  onChange={e => setCommentDraft(d => ({ ...d, [f.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && sendComment(f.id)}
                  className="bg-white border-stone-200"
                />
                <Button
                  aria-live="polite"
                  disabled={!turnstileToken || reviewingCommentId === f.id}
                  onClick={() => sendComment(f.id)}
                  className="bg-stone-900 hover:bg-stone-800 text-white"
                >
                  {reviewingCommentId === f.id ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <DynamicText text="正在自動審核…" />
                    </>
                  ) : (
                    <DynamicText text="發送" />
                  )}
                </Button>
              </div>
              <Turnstile action="feedback_comment" onVerify={setTurnstileToken} resetKey={turnstileResetKey} />
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F6', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <main className="pb-16 pt-12 container mx-auto px-6 md:px-12 max-w-5xl">
        <button
          onClick={() => router.replace('/feedback')}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> <DynamicText text="返回所有主題" />
        </button>

        <div className="mb-10 pb-8 border-b border-stone-200">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Topic</span>
          <h2 style={SERIF} className="text-4xl md:text-5xl text-stone-900 mt-1">
            <DynamicText text={activeCat} />
          </h2>
          <p className="text-stone-500 mt-2 max-w-2xl">
            <DynamicText text={meta.description ?? ''} />
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 self-start">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mb-4">
              <DynamicText text={activeCat} /> · <DynamicText text="建議分類" />
            </p>
            <nav className="space-y-1 border-l border-stone-200">
              <button
                onClick={() => setActiveSub(null)}
                className={`block w-full text-left pl-4 py-2 text-sm border-l-2 -ml-px transition-colors ${
                  activeSub === null
                    ? 'border-primary text-stone-900 font-medium'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <DynamicText text="所有建議" />
                <span className="block text-[11px] text-stone-400">
                  {countByCat[activeCat] || 0} <DynamicText text="建議" />
                </span>
              </button>
              {subNames.map(s => {
                const on = s === activeSub;
                return (
                  <button
                    key={s}
                    onClick={() => setActiveSub(s)}
                    className={`block w-full text-left pl-4 py-2 text-sm border-l-2 -ml-px transition-colors ${
                      on
                        ? 'border-primary text-stone-900 font-medium'
                        : 'border-transparent text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <DynamicText text={s} />
                    <span className="block text-[11px] text-stone-400">
                      {countBySub[s] || 0} <DynamicText text="建議" />
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-stone-200">
              <NewPostDialog
                defaultCategory={activeCat}
                defaultSubCategory={activeSub ?? subNames[0]}
                categories={dialogCategories}
                onCreated={f => {
                  addFeature(f);
                  if (f.category !== activeCat) {
                    router.replace(`/feedback/${encodeURIComponent(f.category)}`);
                    return;
                  }
                  setTab('active');
                  setSortBy('new');
                  setInnerSearch('');
                  setActiveSub(f.subCategory ?? null);
                }}
                trigger={
                  <button className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors shadow-lg">
                    <Plus className="w-4 h-4" />
                    <DynamicText text="張貼新留言" />
                  </button>
                }
              />
              <button
                onClick={() => setDeptSwitchOpen(v => !v)}
                className="mt-3 w-full inline-flex items-center justify-center gap-1 text-xs text-stone-500 hover:text-stone-900"
              >
                <DynamicText text="切換其他部門" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${deptSwitchOpen ? 'rotate-180' : ''}`} />
              </button>
              {deptSwitchOpen && (
                <div className="mt-3 space-y-1 rounded-lg border border-stone-200 bg-white p-2">
                  {categoriesForPage.map(c => (
                    <button
                      key={c.name}
                      onClick={() => router.replace(`/feedback/${encodeURIComponent(c.name)}`)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                        c.name === activeCat
                          ? 'bg-primary/10 text-stone-900 font-medium'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="block">
                        <DynamicText text={c.name} />
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        {countByCat[c.name] || 0} <DynamicText text="建議" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main list */}
          <div className="min-w-0">
            <div className="relative mb-5">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={innerSearch}
                onChange={e => setInnerSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-11 h-11 bg-white border-stone-200 rounded-md"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-3 mb-2">
              <div className="flex flex-wrap items-center gap-6">
                {(['active', 'history'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-3 -mb-[13px] text-[11px] uppercase tracking-[0.25em] font-semibold border-b-2 transition-colors ${
                      tab === t
                        ? 'text-stone-900 border-primary'
                        : 'text-stone-400 border-transparent hover:text-stone-600'
                    }`}
                  >
                    <DynamicText text={t === 'active' ? '建議列表' : '已完成'} />
                  </button>
                ))}
              </div>

              {tab === 'active' && (
                <div className="flex items-center gap-1 rounded-full bg-stone-100 p-1 ml-auto">
                  {(
                    [
                      ['hot', '票數最多'],
                      ['new', '最新建議']
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setSortBy(v)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sortBy === v ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      <DynamicText text={label} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tab === 'active' ? (
              <div>
                {active.map(renderIdeaRow)}
                {active.length === 0 && (
                  <div className="text-center py-24 text-stone-400">
                    <p style={SERIF} className="text-2xl">
                      Nothing here yet.
                    </p>
                    <p className="text-sm mt-2">
                      <DynamicText text="成為第一個在此主題張貼留言的人。" />
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {historyForCat.map(f => (
                  <div key={f.id} className="flex gap-5 md:gap-7 py-8 border-b border-stone-200 last:border-b-0">
                    <div className="shrink-0 w-16 text-center">
                      <div className="w-16 py-2 rounded-md border border-stone-200 bg-white text-stone-900">
                        <ArrowUp className="w-3.5 h-3.5 mx-auto mb-0.5" strokeWidth={2.5} />
                        <span className="block text-xl leading-none font-semibold">{f.likes}</span>
                        <span className="block text-[9px] uppercase tracking-widest mt-1 opacity-60">
                          <DynamicText text="讚好" />
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 style={SERIF} className="text-2xl md:text-[26px] leading-snug text-stone-900">
                        <DynamicText text={f.title} />
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 mb-3 text-xs text-stone-500">
                        <span className="text-primary font-medium">GO-TECH Manager</span>
                        <span className="text-stone-300">·</span>
                        <span>{formatDate(f.shippedAt!, language)}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <DynamicText text="已完成" /> {f.version}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[15px] leading-relaxed">
                        <DynamicText text={f.description} />
                      </p>
                    </div>
                  </div>
                ))}
                {historyForCat.length === 0 && (
                  <p className="text-stone-400 py-16 text-center" style={SERIF}>
                    <DynamicText text="此主題暫無已完成需求。" />
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryContent;
