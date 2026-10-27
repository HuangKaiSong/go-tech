import { Input, Label, Textarea } from '@go-tech-frontend/ui';
import { type BlogArticle, type BlogCategory, type BlogSettings } from '@go-tech/blog-content/model';
import { RichEditor } from '../manual/rich-editor';
import { CoverField } from './image-field';
import type { BlogController } from './use-blog';

function TextField({
  disabled = false,
  label,
  multiline = false,
  name,
  onChange,
  type = 'text',
  value
}: {
  disabled?: boolean;
  label: string;
  multiline?: boolean;
  name: string;
  onChange: (value: string) => void;
  type?: string;
  value: string | number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`blog-${name}`}>{label}</Label>
      {multiline ? (
        <Textarea id={`blog-${name}`} value={value} onChange={e => onChange(e.target.value)} maxLength={2000} />
      ) : (
        <Input
          id={`blog-${name}`}
          type={type}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
export function BlogForm({ controller: c }: { controller: BlogController }) {
  if (!c.draft) return null;
  // 表单允许暂时为空的字段；持久化前由统一契约校验。按种类构造的草稿保持字段完整。
  if (c.kind === 'article' && 'slug' in c.draft) return <ArticleForm value={c.draft} controller={c} />;
  if (c.kind === 'category' && 'name' in c.draft) return <CategoryForm value={c.draft} controller={c} />;
  if (c.kind === 'settings' && 'promotionTitle' in c.draft) return <SettingsForm value={c.draft} controller={c} />;
  return <p role="alert">草稿類型無效，請重新載入</p>;
}
function ArticleForm({ controller: c, value: v }: { controller: BlogController; value: BlogArticle }) {
  const change = (patch: Partial<BlogArticle>) => c.setDraft({ ...v, ...patch });
  return (
    <fieldset disabled={c.busy} className="space-y-4">
      <TextField name="title" label="標題" value={v.title} onChange={title => change({ title })} />
      <TextField
        name="slug"
        label="URL 標識（首次發佈後鎖定）"
        disabled={Boolean(c.selected?.lockedSlug)}
        value={v.slug}
        onChange={slug => change({ slug })}
      />
      <div className="space-y-2">
        <Label htmlFor="blog-category">分類</Label>
        <select
          id="blog-category"
          className="w-full border rounded-md p-2 bg-background"
          value={v.categoryId}
          onChange={e => change({ categoryId: Number(e.target.value) })}
        >
          {!c.data?.categories.length && <option value={0}>請先新增分類</option>}
          {c.data?.categories.map(row => (
            <option key={row.id} value={row.id}>
              {row.draft.name}
              {row.published ? '' : '（未發佈）'}
            </option>
          ))}
        </select>
      </div>
      <TextField name="excerpt" label="摘要" value={v.excerpt} onChange={excerpt => change({ excerpt })} multiline />
      <CoverField value={v} disabled={c.busy} onChange={change} onPendingChange={c.setCoverUploads} />
      <TextField name="cover-alt" label="封面替代文字" value={v.coverAlt} onChange={coverAlt => change({ coverAlt })} />
      <TextField
        name="tags"
        label="標籤（以逗號分隔）"
        value={v.tags.join(',')}
        onChange={value => change({ tags: value ? value.split(/[,，]/) : [] })}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <TextField
          name="date"
          label="展示日期"
          type="date"
          value={v.displayDate}
          onChange={displayDate => change({ displayDate })}
        />
        <TextField
          name="read-min"
          label="閱讀分鐘數"
          type="number"
          value={v.readMin}
          onChange={value => change({ readMin: Number(value) })}
        />
        <TextField
          name="sort"
          label="排序（由小至大）"
          type="number"
          value={v.sortOrder}
          onChange={value => change({ sortOrder: Number(value) })}
        />
      </div>
      <label className="flex gap-2 items-center">
        <input type="checkbox" checked={v.isFeatured} onChange={e => change({ isFeatured: e.target.checked })} />
        精選文章
      </label>
      <Label>文章正文</Label>
      <RichEditor
        imageBaseUrl="/h5-hook"
        label="文章正文"
        numberedHeadings={false}
        disabled={c.busy}
        value={v.body}
        onChange={body => change({ body })}
        onPendingChange={c.setUploads}
      />
    </fieldset>
  );
}
function CategoryForm({ controller: c, value: v }: { controller: BlogController; value: BlogCategory }) {
  return (
    <fieldset disabled={c.busy} className="space-y-4">
      <TextField name="name" label="分類名稱" value={v.name} onChange={name => c.setDraft({ ...v, name })} />
      <TextField
        name="sort"
        label="排序（由小至大）"
        type="number"
        value={v.sortOrder}
        onChange={value => c.setDraft({ ...v, sortOrder: Number(value) })}
      />
    </fieldset>
  );
}
const settingsLabels: Record<keyof BlogSettings, string> = {
  title: '博客標題',
  description: '博客簡介',
  searchPlaceholder: '搜尋提示',
  promotionTitle: '推廣標題',
  promotionDescription: '推廣說明'
};
function SettingsForm({ controller: c, value: v }: { controller: BlogController; value: BlogSettings }) {
  return (
    <fieldset disabled={c.busy} className="space-y-4">
      {(Object.keys(settingsLabels) as (keyof BlogSettings)[]).map(key => (
        <TextField
          key={key}
          name={key}
          label={settingsLabels[key]}
          value={v[key]}
          onChange={value => c.setDraft({ ...v, [key]: value })}
          multiline={key === 'description' || key === 'promotionDescription'}
        />
      ))}
    </fieldset>
  );
}
