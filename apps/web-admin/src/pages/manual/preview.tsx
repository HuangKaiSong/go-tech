import { Input } from '@go-tech-frontend/ui';
import { ManualBody, ManualContents } from '@go-tech/manual-content';
import { Building2, CreditCard, Rocket, Users, Wallet, Wrench } from 'lucide-react';
import type { Selection } from './selection';
const icons = { Building2, CreditCard, Rocket, Users, Wallet, Wrench };
/** 展示经过管理员接口重新读取的已保存草稿；指南正文和目录复用前台渲染器。 */
export function ManualPreview({ selection }: { selection: Selection }) {
  if (selection.kind === 'article')
    return (
      <article>
        <h1 className="text-3xl font-bold">{selection.draft.title}</h1>
        <p className="mt-3 text-muted-foreground">{selection.draft.summary}</p>
        <ManualContents body={selection.draft.body} />
        <ManualBody body={selection.draft.body} />
      </article>
    );
  if (selection.kind === 'category') {
    const Icon = icons[selection.draft.icon];
    return (
      <div className="border rounded-xl p-5 flex gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon />
        </div>
        <div>
          <h2 className="font-bold">{selection.draft.name}</h2>
          <p>{selection.draft.desc}</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="bg-primary text-primary-foreground text-center p-8 rounded-xl">
        <h1 className="text-3xl font-bold">{selection.draft.title}</h1>
        <p className="my-4">{selection.draft.subtitle}</p>
        <Input placeholder={selection.draft.searchPlaceholder} readOnly />
      </div>
      <div className="mt-8 bg-muted p-6 rounded-xl">
        <h2 className="font-bold">{selection.draft.supportTitle}</h2>
        <p>{selection.draft.supportDescription}</p>
        <span className="text-primary">{selection.draft.supportButton}</span>
      </div>
    </>
  );
}
