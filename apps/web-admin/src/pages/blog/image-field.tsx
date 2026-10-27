import { Button, Input, Label } from '@go-tech-frontend/ui';
import type { BlogArticle } from '@go-tech/blog-content/model';
import { contentImageUrl, safeManualUrl } from '@go-tech/manual-content/model';
import { useEffect, useRef, useState } from 'react';
import { uploadManualImage } from '../manual/image-upload';
export function CoverField({
  disabled,
  onChange,
  onPendingChange,
  value
}: {
  disabled: boolean;
  onChange: (patch: Partial<BlogArticle>) => void;
  onPendingChange: (count: number) => void;
  value: BlogArticle;
}) {
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  // 异步上传回调使用最新元数据，避免覆盖上传期间的其他编辑。
  const change = useRef(onChange);
  change.current = onChange;
  const latest = useRef(value);
  latest.current = value;
  useEffect(
    () => () => {
      active.current?.abort();
    },
    []
  );
  async function upload(file: File) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError('');
    onPendingChange(1);
    try {
      const cover = await uploadManualImage(file, controller.signal);
      if (!controller.signal.aborted)
        change.current({ cover, coverAlt: latest.current.coverAlt || latest.current.title || file.name });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '封面上傳失敗');
    } finally {
      if (!controller.signal.aborted) {
        setPending(false);
        onPendingChange(0);
      }
    }
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="blog-cover">封面地址</Label>
      <Input
        id="blog-cover"
        value={value.cover}
        disabled={disabled || pending}
        onChange={e => onChange({ cover: e.target.value })}
      />
      <Label htmlFor="blog-cover-file">上傳封面</Label>
      <Input
        id="blog-cover-file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled || pending}
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload(file);
        }}
      />
      {pending && (
        <div role="status">
          封面上傳中…{' '}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              active.current?.abort();
              setPending(false);
              onPendingChange(0);
            }}
          >
            取消上傳
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {value.cover && safeManualUrl(value.cover, true) && (
        <img
          src={contentImageUrl(value.cover, '/h5-hook')}
          alt={value.coverAlt || '封面預覽'}
          className="max-h-48 rounded-lg object-contain"
        />
      )}
    </div>
  );
}
