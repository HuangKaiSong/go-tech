import { Input, Label, Textarea } from '@go-tech-frontend/ui';
import {
  type ManualAdminData,
  type ManualArticle,
  type ManualCategory,
  type ManualSettings,
  manualIcons
} from '@go-tech/manual-content/model';
import { RichEditor } from './rich-editor';

/** 编辑指南元数据与富文本；已发布记录的 URL 标识由表单和服务端共同锁定。 */
export function ArticleForm({
  categories,
  disabled,
  locked,
  onChange,
  value
}: {
  categories: ManualAdminData['categories'];
  disabled: boolean;
  locked: boolean;
  onChange: (next: ManualArticle) => void;
  value: ManualArticle;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <Label htmlFor="manual-title">標題</Label>
      <Input
        id="manual-title"
        maxLength={200}
        value={value.title}
        onChange={e => onChange({ ...value, title: e.target.value })}
      />
      <Label htmlFor="manual-summary">摘要</Label>
      <Textarea
        id="manual-summary"
        maxLength={1000}
        value={value.summary}
        onChange={e => onChange({ ...value, summary: e.target.value })}
      />
      <Label htmlFor="manual-slug">URL 標識（首次發佈後鎖定）</Label>
      <Input
        id="manual-slug"
        maxLength={120}
        disabled={locked}
        value={value.slug}
        onChange={e => onChange({ ...value, slug: e.target.value })}
        placeholder="getting-started"
      />
      <Label htmlFor="manual-category">所屬主題</Label>
      <select
        id="manual-category"
        className="w-full rounded-md border border-border p-2 bg-background"
        value={value.categoryId}
        onChange={e => onChange({ ...value, categoryId: Number(e.target.value) })}
      >
        {categories.map(row => (
          <option key={row.id} value={row.id}>
            {row.draft.name}
            {row.published ? '' : '（未發佈）'}
          </option>
        ))}
      </select>
      <Label htmlFor="manual-sort">排序（由小至大）</Label>
      <Input
        id="manual-sort"
        type="number"
        min={0}
        max={100000}
        value={value.sortOrder}
        onChange={e => onChange({ ...value, sortOrder: Number(e.target.value) })}
      />
      <Label>指南正文</Label>
      <RichEditor value={value.body} onChange={body => onChange({ ...value, body })} disabled={disabled} />
    </fieldset>
  );
}
/** 编辑主题展示内容及排序；这里只更新本地草稿，由外层统一保存与发布。 */
export function CategoryForm({
  disabled,
  onChange,
  value
}: {
  disabled: boolean;
  onChange: (next: ManualCategory) => void;
  value: ManualCategory;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <Label htmlFor="manual-name">主題名稱</Label>
      <Input
        id="manual-name"
        maxLength={80}
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
      />
      <Label htmlFor="manual-desc">主題說明</Label>
      <Textarea
        id="manual-desc"
        maxLength={500}
        value={value.desc}
        onChange={e => onChange({ ...value, desc: e.target.value })}
      />
      <Label htmlFor="manual-icon">圖標</Label>
      <select
        id="manual-icon"
        className="w-full rounded-md border border-border p-2 bg-background"
        value={value.icon}
        onChange={e => onChange({ ...value, icon: manualIcons.find(icon => icon === e.target.value) ?? 'Rocket' })}
      >
        {manualIcons.map(icon => (
          <option key={icon}>{icon}</option>
        ))}
      </select>
      <Label htmlFor="manual-sort">排序（由小至大）</Label>
      <Input
        id="manual-sort"
        type="number"
        min={0}
        max={100000}
        value={value.sortOrder}
        onChange={e => onChange({ ...value, sortOrder: Number(e.target.value) })}
      />
    </fieldset>
  );
}
/** 编辑首页可配置文案，保持支援按钮的业务去向固定。 */
export function SettingsForm({
  disabled,
  onChange,
  value
}: {
  disabled: boolean;
  onChange: (next: ManualSettings) => void;
  value: ManualSettings;
}) {
  const labels: Record<keyof ManualSettings, string> = {
    title: '首頁主標題',
    subtitle: '首頁副標題',
    searchPlaceholder: '搜尋佔位文案',
    supportTitle: '支援區標題',
    supportDescription: '支援區說明',
    supportButton: '支援按鈕文案'
  };
  return (
    <fieldset disabled={disabled} className="space-y-4">
      {(Object.keys(labels) as (keyof ManualSettings)[]).map(key => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`manual-${key}`}>{labels[key]}</Label>
          <Input
            id={`manual-${key}`}
            value={value[key]}
            maxLength={key === 'supportButton' ? 80 : 500}
            onChange={e => onChange({ ...value, [key]: e.target.value })}
          />
        </div>
      ))}
    </fieldset>
  );
}
