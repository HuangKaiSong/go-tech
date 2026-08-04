import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@go-tech-frontend/ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { DynamicText } from '@/app/components/DynamicI18nText.client';
import { SERIF } from '@/app/feedback/data';
import type { Feature } from '@/app/feedback/useFeedbackFeatures';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useAuth } from '@/contexts/AuthContext';
import Turnstile from './turnstile';

interface Props {
  categories: { name: string; subNames: string[] }[];
  defaultCategory?: string;
  defaultSubCategory?: string;
  onCreated: (f: Feature) => void;
  trigger: React.ReactNode;
}

const subsOf = (cats: { name: string; subNames: string[] }[], cat: string) =>
  cats.find(c => c.name === cat)?.subNames ?? [];

const NewPostDialog = ({ categories, defaultCategory, defaultSubCategory, onCreated, trigger }: Props) => {
  const { isLoggedIn } = useAuth();
  const descriptionPlaceholder = useBatchTranslation('請說明使用場景與期望效果');
  const fillTitleAndDescription = useBatchTranslation('請填寫標題和描述');
  const loginRequired = useBatchTranslation('請先登入後再操作');
  const postFailed = useBatchTranslation('張貼失敗');
  const postSuccess = useBatchTranslation('需求已張貼上留言板,感謝你的反饋!');
  const titlePlaceholder = useBatchTranslation('用一句話描述你的需求');
  const verificationRequired = useBatchTranslation('請先完成人機驗證');
  const catNames = categories.map(c => c.name);
  const initialCat = defaultCategory || catNames[0];
  const initialSubs = subsOf(categories, initialCat);
  const initialSub =
    defaultSubCategory && initialSubs.includes(defaultSubCategory) ? defaultSubCategory : initialSubs[0];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState(initialCat);
  const [sub, setSub] = useState(initialSub);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const pickCat = (c: string) => {
    setCat(c);
    setSub(subsOf(categories, c)[0]);
  };

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen && !isLoggedIn) {
      toast.warning(loginRequired);
      return;
    }
    if (nextOpen) {
      const nextCat = defaultCategory || catNames[0];
      const nextSubs = subsOf(categories, nextCat);
      setCat(nextCat);
      setSub(defaultSubCategory && nextSubs.includes(defaultSubCategory) ? defaultSubCategory : nextSubs[0]);
      setTurnstileToken('');
      setTurnstileResetKey(key => key + 1);
    }
    setOpen(nextOpen);
  };

  const submit = async () => {
    if (!isLoggedIn) {
      toast.warning(loginRequired);
      return;
    }
    if (!title.trim() || !desc.trim()) {
      toast.error(fillTitleAndDescription);
      return;
    }
    if (!turnstileToken) {
      toast.warning(verificationRequired);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback/features', {
        body: JSON.stringify({
          category: cat,
          description: desc.trim(),
          subCategory: sub,
          title: title.trim(),
          turnstileToken
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const result = (await response.json()) as { data?: Feature; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message || postFailed);

      onCreated(result.data);
      setTitle('');
      setDesc('');
      setOpen(false);
      toast.success(postSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : postFailed);
    } finally {
      setSubmitting(false);
      setTurnstileToken('');
      setTurnstileResetKey(key => key + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#F9F8F6] border-stone-200">
        <DialogHeader>
          <DialogTitle style={SERIF} className="text-3xl text-stone-900">
            <DynamicText text="張貼新留言" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-stone-500 mb-2 block">
                <DynamicText text="部門" />
              </label>
              <Select value={cat} onValueChange={pickCat}>
                <SelectTrigger className="bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catNames.map(c => (
                    <SelectItem key={c} value={c}>
                      <DynamicText text={c} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-stone-500 mb-2 block">
                <DynamicText text="建議分類" />
              </label>
              <Select value={sub} onValueChange={setSub}>
                <SelectTrigger className="bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subsOf(categories, cat).map(s => (
                    <SelectItem key={s} value={s}>
                      <DynamicText text={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-stone-500 mb-2 block">
              <DynamicText text="標題" />
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              maxLength={80}
              className="bg-white border-stone-200"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-stone-500 mb-2 block">
              <DynamicText text="詳細描述" />
            </label>
            <Textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={5}
              maxLength={500}
              className="bg-white border-stone-200"
            />
          </div>
        </div>
        <Turnstile action="feedback_post" onVerify={setTurnstileToken} resetKey={turnstileResetKey} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <DynamicText text="取消" />
          </Button>
          <Button
            disabled={submitting || !turnstileToken}
            onClick={submit}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-full"
          >
            <DynamicText text={submitting ? '張貼中…' : '張貼'} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPostDialog;
