'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DynamicText } from '@/app/components/DynamicI18nText.client';

const BackButton = () => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/my-orders');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      <DynamicText text="返回我的訂單" />
    </button>
  );
};

export default BackButton;
