'use client';
/** 数据库不可用时保留显式重试入口，避免静态兜底掩盖初始化或存储故障。 */
export default function ManualError({ reset }: { reset: () => void }) {
  return (
    <main className="container mx-auto flex-1 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">操作手冊暫時無法載入</h1>
      <p className="my-4 text-muted-foreground">請稍後重試，或聯絡支援。</p>
      <button onClick={reset} className="rounded-full bg-primary text-primary-foreground px-6 py-3">
        重新載入
      </button>
    </main>
  );
}
