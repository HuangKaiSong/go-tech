import { Button, Input, Label, toast } from '@go-tech-frontend/ui';
import { useMutation } from '@tanstack/react-query';
import { Clock, Save, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { setTrailDays } from '@/pages/package-edit/package-api';

export default function OrderConfigPage() {
  const [days, setDays] = useState('');
  const save = useMutation({
    mutationFn: setTrailDays,
    onSuccess: () => {
      toast.success('設定已保存');
    },
    onError: error => {
      toast.error(error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="size-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">全局配置設定</h1>
      </div>
      <section
        className="border-y border-border bg-card px-6 py-8 text-card-foreground"
        aria-labelledby="auto-activation-heading"
      >
        <h2 id="auto-activation-heading" className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <Clock className="size-5 text-primary" aria-hidden="true" />
          套餐自動激活時間設定
        </h2>
        <form
          className="space-y-6"
          onSubmit={event => {
            event.preventDefault();
            if (!save.isPending) save.mutate(Number(days));
          }}
        >
          <div className="space-y-3">
            <Label htmlFor="trail-days" className="block leading-5 font-normal">
              自動激活時間
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="trail-days"
                type="number"
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                required
                value={days}
                onChange={event => setDays(event.target.value)}
                disabled={save.isPending}
                placeholder="請輸入天數"
                aria-describedby="trail-days-unit"
                className="max-w-90 min-w-0"
              />
              <span id="trail-days-unit" className="shrink-0 text-sm text-muted-foreground">
                天
              </span>
            </div>
          </div>
          <Button type="submit" loading={save.isPending} className="font-normal">
            <Save aria-hidden="true" />
            {save.isPending ? '保存中…' : '保存設定'}
          </Button>
        </form>
      </section>
    </div>
  );
}
