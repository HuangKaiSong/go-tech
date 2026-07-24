'use client';

import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';

interface DynamicTextClientProps {
  text: string;
}

export function DynamicText({ text }: DynamicTextClientProps) {
  if (!text) {
    return text;
  }

  // oxlint-disable-next-line react-hooks/rules-of-hooks
  const translated = useBatchTranslation(text);

  return <span>{translated}</span>;
}
