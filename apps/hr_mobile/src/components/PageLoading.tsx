import { Loader2 } from 'lucide-react';

/** 页面级加载回退：懒加载路由切换时的 Suspense fallback */
const PageLoading = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">页面加载中…</p>
  </div>
);

export default PageLoading;
