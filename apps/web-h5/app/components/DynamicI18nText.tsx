import { DynamicText as DynamicTextClient } from './DynamicI18nText.client';

interface DynamicTextProps {
  text: string;
}

export function DynamicText({ text }: DynamicTextProps) {
  return <DynamicTextClient text={text} />;
}
