'use client';

import { Button, Input, Skeleton } from '@go-tech-frontend/ui';
import { useDebounce } from 'ahooks';
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  History,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  User
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import { OfficialAvatar, SmallOfficialAvatar, SmallUserAvatar, UserAvatar } from '@/app/components/feedback/Avatars';
import NewPostDialog from '@/app/components/feedback/NewPostDialog';
import Turnstile from '@/app/components/feedback/turnstile';
import Footer from '@/app/components/Footer';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useAuth } from '@/contexts/AuthContext';
import type { FbFeature } from '@/db/scheam';
import { SERIF, statusMeta } from './data';
import { formatDate, maskName, orderCommentsByThread } from './useFeedbackFeatures';
import type { Feature } from './useFeedbackFeatures';

/** 服务端传入的原始分类数据 */
interface CategoryFromDB {
  description: string | null;
  featureCount: number;
  icon: string | null;
  id: number;
  name: string;
  subCategories: { id: number; name: string; sortOrder: number }[];
}

interface Props {
  categoriesFromDB: CategoryFromDB[];
  featureCompleted: FbFeature[];
  language: string;
}

/** Kebab-case → PascalCase: building-2 → Building2 */
const kebabToPascal = (name: string) =>
  name
    .replace(/(^|-)([a-z])/g, (_m: string, _sep: string, char: string) => char.toUpperCase())
    .replace(/-(\d)/g, (_m: string, _sep: string, digit: string) => digit);

/** API icon 字符串 → Lucide 组件（动态查找，不存在则用 Sparkles） */
const resolveIcon = (iconName: string | null): React.ComponentType<{ className?: string; strokeWidth?: number }> => {
  if (!iconName) return LucideIcons.Sparkles;
  const pascal = kebabToPascal(iconName);
  const allIcons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string; strokeWidth?: number }>
  >;
  return allIcons[pascal] ?? LucideIcons.Sparkles;
};

const FeedbackContent = ({ categoriesFromDB, featureCompleted, language }: Props) => {
  const { isLoggedIn, user } = useAuth();
  const currentUser = user?.nickname ?? '';
  const router = useRouter();
  const commentFailed = useBatchTranslation('留言失敗');
  const contentRejected = useBatchTranslation('留言未通過安全審核，請修改後重試');
  const loginRequired = useBatchTranslation('請先登入後再操作');
  const operationFailed = useBatchTranslation('操作失敗');
  const replyText = useBatchTranslation('回覆');
  const searchPlaceholder = useBatchTranslation('搜尋需求…');
  const verificationRequired = useBatchTranslation('請先完成人機驗證');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, { wait: 500 });
  const isSearching = search !== debouncedSearch;
  const [showHistory, setShowHistory] = useState(false);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [openReply, setOpenReply] = useState<string | null>(null);
  const reviewingCommentRef = useRef(false);
  const [reviewingCommentId, setReviewingCommentId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  // API 搜索结果
  const [searchResults, setSearchResults] = useState<Feature[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) {
      setSearchResults([]);
      setApiLoading(false);
      return;
    }

    // 取消上一个请求
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setApiLoading(true);

    fetch(`/api/feedback/features?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(json => {
        if (!controller.signal.aborted) {
          setSearchResults((json as { data: Feature[] }).data ?? []);
          setApiLoading(false);
        }
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          if (!controller.signal.aborted) setApiLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  const requireLogin = () => {
    if (isLoggedIn) return true;
    toast.warning(loginRequired);
    return false;
  };

  const toggleLike = async (id: string) => {
    if (!requireLogin()) return;

    try {
      const response = await fetch(`/api/feedback/features/${id}/vote`, { method: 'POST' });
      const result = (await response.json()) as {
        data?: { liked: boolean; likes: number; userName: string };
        message?: string;
      };
      if (!response.ok || !result.data) throw new Error(result.message || operationFailed);

      const { liked, likes, userName } = result.data;
      setSearchResults(prev =>
        prev.map(feature =>
          feature.id === id
            ? {
                ...feature,
                likedBy: liked
                  ? [...feature.likedBy.filter(name => name !== userName), userName]
                  : feature.likedBy.filter(name => name !== userName),
                likes
              }
            : feature
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : operationFailed);
    }
  };

  const addComment = async (featureId: string, content: string, token: string) => {
    if (!requireLogin()) return false;

    try {
      const response = await fetch(`/api/feedback/features/${featureId}/comments`, {
        body: JSON.stringify({ content, turnstileToken: token }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const result = (await response.json()) as {
        code?:
          | 'BOT_VERIFICATION_FAILED'
          | 'BOT_VERIFICATION_UNAVAILABLE'
          | 'CONTENT_MODERATION_FAILED'
          | 'CONTENT_REJECTED';
        data?: Feature['comments'][number];
        message?: string;
      };
      if (result.code === 'CONTENT_REJECTED') {
        toast.error(result.message || contentRejected);
        return false;
      }
      if (!response.ok || !result.data) {
        toast.error(result.message || commentFailed);
        return false;
      }

      const comment = result.data;
      setSearchResults(prev =>
        prev.map(feature =>
          feature.id === featureId ? { ...feature, comments: [...feature.comments, comment] } : feature
        )
      );
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : commentFailed);
      return false;
    }
  };

  /** 将服务端数据转为组件使用的 categoryMeta */
  const categoryMeta = categoriesFromDB.map(c => ({
    desc: c.description ?? '',
    featureCount: c.featureCount,
    icon: resolveIcon(c.icon),
    name: c.name,
    subs: c.subCategories.map(s => s.name)
  }));

  /** 传给 NewPostDialog 的分类数据 */
  const dialogCategories = categoryMeta.map(c => ({ name: c.name, subNames: c.subs }));

  const openCategory = (name: string) => {
    router.push(`/feedback/${encodeURIComponent(name)}`);
  };

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

  const renderPost = (f: Feature) => {
    const liked = Boolean(currentUser) && f.likedBy.includes(currentUser);
    const replyOpen = openReply === f.id;

    return (
      <div key={f.id} className="space-y-4">
        <div className="flex gap-5 items-start">
          <UserAvatar name={f.author} />
          <div className="flex-1 min-w-0">
            <div className="bg-stone-100/80 border border-stone-200 rounded-md rounded-tl-none px-6 py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 pb-3 border-b border-stone-200/80">
                <span className="text-primary font-semibold text-sm">{maskName(f.author)}</span>
                <span className="text-stone-300">|</span>
                <span className="text-xs text-stone-500">{formatDate(f.createdAt, language)}</span>
                <span className="text-stone-300">·</span>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">
                  <DynamicText text={f.category} />
                </span>
                <span
                  className={`ml-auto px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusMeta[f.status].badge}`}
                >
                  <DynamicText text={statusMeta[f.status].label} />
                </span>
              </div>
              <h3 style={SERIF} className="text-2xl md:text-[28px] leading-snug text-stone-900 mb-2">
                {f.title}
              </h3>
              <p className="text-stone-600 text-[15px] leading-relaxed">{f.description}</p>

              <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-center gap-2">
                <button
                  onClick={() => toggleLike(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    liked
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>
                    {f.likes} <DynamicText text="讚" />
                  </span>
                </button>
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
            </div>
          </div>
        </div>

        {orderCommentsByThread(f.comments).map(c => (
          <div key={c.id} className={`flex gap-4 items-start ${c.parentId ? 'ml-20 md:ml-28' : 'ml-12 md:ml-20'}`}>
            {c.isOfficial ? <SmallOfficialAvatar /> : <SmallUserAvatar />}
            <div className="flex-1 min-w-0">
              <div
                className={`border rounded-md rounded-tl-none px-5 py-4 ${
                  c.isOfficial ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-2">
                  <span className={`font-semibold text-sm ${c.isOfficial ? 'text-primary' : 'text-stone-900'}`}>
                    {c.isOfficial ? c.author : maskName(c.author)}
                  </span>
                  {c.isOfficial && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                      <DynamicText text="官方" />
                    </span>
                  )}
                  <span className={c.isOfficial ? 'text-stone-600' : 'text-stone-300'}>|</span>
                  <span className={`text-xs ${c.isOfficial ? 'text-stone-400' : 'text-stone-500'}`}>
                    {formatDate(c.createdAt, language)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${c.isOfficial ? 'text-stone-200' : 'text-stone-700'}`}>
                  {c.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {replyOpen && (
          <div className="flex gap-4 items-start ml-12 md:ml-20">
            <div className="w-10 h-10 shrink-0 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <div className="flex-1 space-y-3">
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
          </div>
        )}
      </div>
    );
  };

  let viewMode: 'browse' | 'loading' | 'results';
  if (debouncedSearch.trim() && !apiLoading) {
    viewMode = 'results';
  } else if (isSearching || (debouncedSearch.trim() && apiLoading)) {
    viewMode = 'loading';
  } else {
    viewMode = 'browse';
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-stone-100/70 border-b border-stone-200">
        <div className="container mx-auto pt-10 pb-14 px-6 md:px-12 max-w-5xl">
          <div className="flex items-baseline gap-3 flex-wrap mb-4">
            <h1 style={SERIF} className="text-4xl md:text-6xl text-stone-900 tracking-tight">
              <DynamicText text="分享並支持你對" /> <span className="text-primary">GO-TECH</span>{' '}
              <DynamicText text="的想法" />
            </h1>
          </div>
          <p className="text-stone-500 leading-relaxed max-w-2xl mb-7">
            <DynamicText text="先選擇一個主題,再瀏覽或張貼該主題下的細化需求。高票需求將被優先開發。" />
          </p>
          <div className="relative max-w-2xl">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-12 h-12 border-stone-200 rounded-md"
            />
          </div>
        </div>
      </section>
      <main className="pb-16 container mx-auto px-6 md:px-12 max-w-5xl pt-16">
        {viewMode === 'results' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 style={SERIF} className="text-3xl text-stone-900">
                <DynamicText text="搜尋結果" /> <span className="text-stone-400 text-xl">({searchResults.length})</span>
              </h2>
              <button onClick={() => setSearch('')} className="text-sm text-stone-500 hover:text-stone-900">
                <DynamicText text="清除搜尋" />
              </button>
            </div>
            <div className="space-y-10">
              {searchResults.map(renderPost)}
              {searchResults.length === 0 && (
                <p className="text-stone-400 py-16 text-center" style={SERIF}>
                  Nothing found.
                </p>
              )}
            </div>
          </div>
        )}

        {viewMode === 'loading' && (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-5 items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'browse' && (
          <div className="space-y-16">
            <div>
              <h2 style={SERIF} className="text-3xl text-stone-900 mb-8">
                <DynamicText text="瀏覽需求主題" />
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryMeta.map(c => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.name}
                      onClick={() => openCategory(c.name)}
                      className="group text-left bg-white border border-stone-200 rounded-md p-6 hover:border-stone-900 hover:-translate-y-0.5 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-md bg-stone-900 text-primary flex items-center justify-center">
                          <Icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">
                          {c.featureCount} <DynamicText text="則需求" />
                        </span>
                      </div>
                      <h3 style={SERIF} className="text-2xl text-stone-900 mb-1.5">
                        <DynamicText text={c.name} />
                      </h3>
                      <p className="text-sm text-stone-500 leading-relaxed min-h-[40px]">
                        <DynamicText text={c.desc} />
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                        <DynamicText text="瀏覽需求" />
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 style={SERIF} className="text-3xl text-stone-900 mb-8">
                <DynamicText text="使用需求留言板" />
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <NewPostDialog
                  categories={dialogCategories}
                  onCreated={f => {
                    router.push(`/feedback/${encodeURIComponent(f.category)}`);
                  }}
                  trigger={
                    <button className="text-left bg-stone-900 text-white rounded-md p-7 hover:bg-stone-800 transition-colors">
                      <Plus className="w-5 h-5 text-primary mb-4" />
                      <h3 style={SERIF} className="text-2xl mb-1.5">
                        <DynamicText text="張貼新留言" />
                      </h3>
                      <p className="text-sm text-stone-400 leading-relaxed">
                        <DynamicText text="選擇主題,描述你的使用場景與期望效果,團隊會逐則回覆。" />
                      </p>
                    </button>
                  }
                />
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="text-left bg-white border border-stone-200 rounded-md p-7 hover:border-stone-900 transition-colors shadow-sm"
                >
                  <History className="w-5 h-5 text-primary mb-4" />
                  <h3 style={SERIF} className="text-2xl text-stone-900 mb-1.5">
                    <DynamicText text="歷史記錄" />
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    <DynamicText text="查看已完成的需求與版本更新記錄。" />
                  </p>
                </button>
              </div>
            </div>

            {showHistory && (
              <div className="space-y-8">
                <h2 style={SERIF} className="text-3xl text-stone-900">
                  <DynamicText text="已完成需求" />
                </h2>
                {featureCompleted.map(f => (
                  <div key={f.id} className="flex gap-5 items-start">
                    <OfficialAvatar />
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-stone-200 rounded-md rounded-tl-none px-6 py-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 pb-3 border-b border-stone-200/80">
                          <span className="text-primary font-semibold text-sm">GO-TECH Manager</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                            <DynamicText text="官方公告" />
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="text-xs text-stone-500">
                            {formatDate(f.shippedAt?.toISOString() ?? '', language)}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <DynamicText text="已完成" /> {f.version}
                          </span>
                        </div>
                        <h3 style={SERIF} className="text-2xl md:text-[28px] leading-snug text-stone-900 mb-2">
                          <DynamicText text={f.title} />
                        </h3>
                        <p className="text-stone-600 text-[15px] leading-relaxed">
                          <DynamicText text={f.description} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default FeedbackContent;
