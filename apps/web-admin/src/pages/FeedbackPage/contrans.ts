import type { FeedbackStatus } from './types';

export const statusOptions: { label: string; value: FeedbackStatus }[] = [
  { value: 'pending', label: '待評估' },
  { value: 'developing', label: '開發中' },
  { value: 'shipped', label: '已完成' }
];

export const statusStyle: Record<FeedbackStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  developing: 'bg-primary/20 text-primary',
  shipped: 'bg-secondary text-secondary-foreground'
};
