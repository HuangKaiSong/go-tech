const skeletonCards = ['first', 'second', 'third'];

export default function PricingSectionSkeleton() {
  return (
    <section className="bg-background py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在載入定價方案</span>
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-5xl flex-row flex-wrap items-center justify-center gap-6">
          {skeletonCards.map(card => (
            <div
              key={card}
              className="basis-3/10 animate-pulse rounded-lg border border-border p-6 motion-reduce:animate-none"
            >
              <div className="mx-auto mb-8 h-6 w-2/3 rounded bg-muted" />
              <div className="mx-auto mb-3 h-10 w-1/2 rounded bg-muted" />
              <div className="mx-auto mb-8 h-4 w-3/4 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 h-20 w-56 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </section>
  );
}
