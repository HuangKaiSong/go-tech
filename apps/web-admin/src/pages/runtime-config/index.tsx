import { Button, Input, Label } from '@go-tech-frontend/ui';
import { Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { getStoredToken } from '@/hooks/use-auth';
const fieldSchema = z.object({
  key: z.string(),
  type: z.string(),
  group: z.string(),
  secret: z.boolean().optional(),
  required: z.boolean().optional(),
  value: z.string().optional(),
  configured: z.boolean(),
  source: z.enum(['database', 'environment', 'default'])
});
const snapshotSchema = z.object({
  version: z.number().int(),
  contextVersion: z.string(),
  fields: z.array(fieldSchema)
});
type Snapshot = z.infer<typeof snapshotSchema>;
type Store = 'business' | 'infrastructure';
type Changes = Record<string, string | null>;
const previewSchema = z.object({
  confirmation: z.string(),
  targetVersion: z.number().optional(),
  changes: z.array(
    z.object({
      key: z.string(),
      changed: z.boolean(),
      secret: z.boolean().optional(),
      sourceValue: z.string().optional(),
      targetValue: z.string().optional()
    })
  )
});
type Preview = z.infer<typeof previewSchema>;
async function request(store: Store, init: RequestInit = {}) {
  const token = getStoredToken()?.replace(/^Bearer\s+/i, '');
  const response = await fetch(`/h5-hook/api/admin/runtime-config/${store}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}`, ...init.headers }
  });
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('code' in body) || body.code !== 200 || !response.ok) {
    throw new Error(
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : '配置请求失败'
    );
  }
  return 'data' in body ? body.data : undefined;
}
const sourceNames = { database: '已保存', environment: '环境变量', default: '默认值' };
const fieldDescriptions: Record<string, string> = {
  API_INTERNAL_URL: '门户服务端访问业务后端的首选地址。',
  NEXT_PUBLIC_API_URL:
    '门户业务接口代理的目标地址（/go-tech、/pms-resource、/pms-admin），同时作为 API_INTERNAL_URL 未配置时的服务端回退地址。'
};

function fieldOptions(type: string) {
  if (type === 'boolean')
    return [
      { value: '', label: '未设置' },
      { value: 'true', label: '启用' },
      { value: 'false', label: '关闭' }
    ];
  if (type === 'locale') return ['zh-hk', 'zh-cn', 'en-us'].map(value => ({ value, label: value }));
  if (type === 'provider') return ['deepl', 'google'].map(value => ({ value, label: value }));
  return undefined;
}

function ConfigForm({
  generation,
  onInfrastructureSaved,
  store
}: {
  generation: number;
  onInfrastructureSaved: () => void;
  store: Store;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [changes, setChanges] = useState<Changes>({});
  const [preview, setPreview] = useState<Preview>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    request(store, { signal: controller.signal })
      .then(value => {
        setSnapshot(snapshotSchema.parse(value));
        setChanges({});
        setPreview(undefined);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '加载失败');
      });
    return () => controller.abort();
  }, [store, reload, generation]);
  const update = (key: string, value: string | null) => {
    setChanges(previous => ({ ...previous, [key]: value }));
    setPreview(undefined);
    setMessage('');
  };
  const run = async (action: 'preview' | 'save') => {
    if (!snapshot) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'preview') {
        setPreview(previewSchema.parse(await request(store, { method: 'POST', body: JSON.stringify({ changes }) })));
      } else {
        await request(store, {
          method: 'PATCH',
          body: JSON.stringify({
            version: snapshot.version,
            contextVersion: snapshot.contextVersion,
            changes,
            confirmation: preview?.confirmation
          })
        });
        setChanges({});
        setPreview(undefined);
        setMessage('配置已保存并生效');
        if (store === 'infrastructure') onInfrastructureSaved();
        setReload(value => value + 1);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };
  const needsPreview = store === 'infrastructure' && 'DATABASE_URL' in changes;
  const saveLabel = needsPreview ? '确认切换并保存' : '保存并生效';
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{store === 'infrastructure' ? '基础设施配置 · SQLite' : '业务配置'}</h2>
      {store === 'business' && (
        <p className="text-sm text-muted-foreground">此处配置业务接口、支付、站点等功能；保存的配置值存储于 MySQL。</p>
      )}
      {store === 'infrastructure' && (
        <p className="text-sm text-muted-foreground">
          切换数据库前请先完成目标库的表结构与数据迁移。切换后采用目标库配置；Redis
          数据不会自动迁移。修改会话密钥会使旧凭证失效，修改管理员验签密钥必须同步外部平台，可能需要重新登录。配置错误可通过服务器本机恢复命令修复。
        </p>
      )}
      {!snapshot && !error && <p role="status">加载中…</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {snapshot &&
        [...new Set(snapshot.fields.map(field => field.group))].map(group => (
          <fieldset key={group} className="space-y-3 rounded border p-3">
            <legend className="px-2 font-medium">{group}</legend>
            {snapshot.fields
              .filter(field => field.group === group)
              .map(field => {
                const change = changes[field.key];
                let value = field.secret ? '' : (field.value ?? '');
                if (typeof change === 'string') value = change;
                const options = fieldOptions(field.type);
                const secretPlaceholder = field.configured ? '已配置；输入新值以替换' : '未配置';
                let changeHint = field.key in changes ? ' · 待保存' : '';
                if (change === null) changeHint = ' · 待恢复环境默认值';
                const id = `${store}-${field.key}`;
                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={id}>{field.key}</Label>
                    {fieldDescriptions[field.key] && (
                      <p id={`${id}-description`} className="text-xs text-muted-foreground">
                        {fieldDescriptions[field.key]}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {options ? (
                        <select
                          id={id}
                          value={value}
                          disabled={busy || change === null}
                          onChange={event => update(field.key, event.target.value)}
                          className="h-10 rounded border bg-background px-3"
                        >
                          {options.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={id}
                          aria-describedby={fieldDescriptions[field.key] ? `${id}-description` : undefined}
                          type={field.secret ? 'password' : 'text'}
                          value={value}
                          disabled={busy || change === null}
                          autoComplete="off"
                          placeholder={field.secret ? secretPlaceholder : ''}
                          onChange={event => update(field.key, event.target.value)}
                          className="min-w-48 flex-1"
                        />
                      )}
                      <Button type="button" variant="outline" disabled={busy} onClick={() => update(field.key, null)}>
                        恢复环境默认
                      </Button>
                      {store === 'business' && !field.required && (
                        <Button type="button" variant="outline" disabled={busy} onClick={() => update(field.key, '')}>
                          清空
                        </Button>
                      )}
                      {field.key in changes && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setChanges(previous => {
                              const next = { ...previous };
                              delete next[field.key];
                              return next;
                            });
                            setPreview(undefined);
                          }}
                        >
                          撤销修改
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sourceNames[field.source]}
                      {field.secret && (field.configured ? ' · 已配置' : ' · 未配置')}
                      {changeHint}
                    </p>
                  </div>
                );
              })}
          </fieldset>
        ))}
      {preview && (
        <div className="rounded border p-3 text-sm">
          <p>连接验证通过。切库后将采用目标库配置，业务配置版本：{preview.targetVersion ?? '不涉及切库'}。</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th scope="col">配置项</th>
                  <th scope="col">当前值</th>
                  <th scope="col">目标值</th>
                </tr>
              </thead>
              <tbody>
                {preview.changes
                  .filter(item => item.changed)
                  .map(item => (
                    <tr key={item.key}>
                      <th scope="row" className="break-all py-2 pr-3 font-normal">
                        {item.key}
                      </th>
                      <td className="break-all pr-3">{item.secret ? '值已隐藏' : item.sourceValue || '空'}</td>
                      <td className="break-all">{item.secret ? '值已隐藏' : item.targetValue || '空'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!preview.changes.some(item => item.changed) && <p>业务配置无差异。</p>}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {needsPreview && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => run('preview')}>
            验证并预览切库差异
          </Button>
        )}
        <Button
          type="button"
          disabled={busy || !snapshot || !Object.keys(changes).length || (needsPreview && !preview)}
          onClick={() => run('save')}
        >
          {busy ? '处理中…' : saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setSnapshot(undefined);
            setReload(value => value + 1);
          }}
        >
          重新加载
        </Button>
      </div>
    </section>
  );
}
export default function RuntimeConfigPage() {
  const [generation, setGeneration] = useState(0);
  const onInfrastructureSaved = () => setGeneration(value => value + 1);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">运行配置</h1>
      </div>
      <p className="text-sm text-muted-foreground">服务端后续请求直接使用新配置；已打开的门户页面通过 SSE 自动更新。</p>
      <ConfigForm store="infrastructure" generation={generation} onInfrastructureSaved={onInfrastructureSaved} />
      <ConfigForm store="business" generation={generation} onInfrastructureSaved={onInfrastructureSaved} />
    </div>
  );
}
