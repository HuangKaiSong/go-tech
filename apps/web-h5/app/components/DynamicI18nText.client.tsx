'use client';

import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';

interface DynamicTextClientProps {
  text: string;
}

export function DynamicText({ text }: DynamicTextClientProps) {
  if (!text.trim()) {
    return '';
  }

  return <TranslatedText text={text} />;
}

function TranslatedText({ text }: DynamicTextClientProps) {
  const translated = useBatchTranslation(text);

  return <span>{translated}</span>;
}
