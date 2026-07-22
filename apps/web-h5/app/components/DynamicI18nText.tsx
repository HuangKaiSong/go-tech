'use client';

import React from 'react';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';

interface DynamicTextProps {
  // 加载时的占位
  loading?: React.ReactNode;
  text: string; // 同 fallback
}

export function DynamicText({ loading, text }: DynamicTextProps) {
  if (!text) {
    return text;
  }

  // oxlint-disable-next-line react-hooks/rules-of-hooks
  const translated = useBatchTranslation(text);

  if (translated === text && text !== '') {
    // 可能还在翻译中，显示 loading（可选）
    return loading || <span>{translated}</span>;
  }

  return <span>{translated}</span>;
}
