import type { BlogDraft } from '@go-tech/blog-content/model';
import { ManualBody } from '@go-tech/manual-content';
import { contentImageUrl, safeManualUrl } from '@go-tech/manual-content/model';
export function BlogPreview({ draft }: { draft: BlogDraft }) {
  if ('slug' in draft)
    return (
      <article className="space-y-5">
        <h1 className="text-3xl font-bold">{draft.title}</h1>
        <p className="text-sm text-muted-foreground">
          {draft.displayDate} · {draft.readMin} 分鐘閱讀{draft.isFeatured ? ' · 精選' : ''}
        </p>
        {draft.cover && safeManualUrl(draft.cover, true) && (
          <img src={contentImageUrl(draft.cover, '/h5-hook')} alt={draft.coverAlt} className="w-full rounded-xl" />
        )}
        <p className="border-l-4 border-primary pl-4 text-lg">{draft.excerpt}</p>
        <ManualBody numberedHeadings={false} imageBaseUrl="/h5-hook" body={draft.body} />
        <div className="flex flex-wrap gap-2">
          {draft.tags.map(tag => (
            <span key={tag} className="rounded-full border px-3 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </article>
    );
  if ('name' in draft) return <div className="rounded-full border px-4 py-2 w-fit">{draft.name}</div>;
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-foreground text-background p-8">
        <h1 className="text-3xl font-bold">{draft.title}</h1>
        <p className="mt-3">{draft.description}</p>
        <input
          readOnly
          placeholder={draft.searchPlaceholder}
          className="mt-6 rounded-full bg-background text-foreground px-4 py-2 w-full"
        />
      </div>
      <div className="rounded-xl bg-primary/10 p-6 text-center">
        <h2 className="font-bold text-xl">{draft.promotionTitle}</h2>
        <p>{draft.promotionDescription}</p>
      </div>
    </div>
  );
}
