'use client';
export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <main className="container mx-auto flex-1 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">博客暫時無法載入</h1>
      <p className="text-muted-foreground mb-6">請稍後重試</p>
      <button onClick={reset} className="rounded-lg bg-primary text-primary-foreground px-5 py-2">
        重新載入
      </button>
    </main>
  );
}
