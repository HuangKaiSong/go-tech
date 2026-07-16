import { CheckCircle2, CircleCheck, Clock, Lock, PlayCircle } from 'lucide-react';
import type { CourseStatus } from './types';

export const getStatusConfig = (status: CourseStatus) => {
  switch (status) {
    case 'completed':
      return {
        label: '已完成',
        color: 'text-[hsl(var(--success))]',
        bg: 'bg-[hsl(var(--success))]/10',
        icon: CheckCircle2
      };
    case 'in_progress':
      return {
        label: '進行中',
        color: 'text-primary',
        bg: 'bg-primary/10',
        icon: Clock
      };
    default:
      return {
        label: '未解鎖',
        color: 'text-muted-foreground',
        bg: 'bg-muted',
        icon: Lock
      };
  }
};

export const getModuleIconBg = (completed: boolean, canStart: boolean) => {
  if (completed) return 'bg-[hsl(var(--success))]/10';
  if (canStart) return 'bg-primary/10';
  return 'bg-muted';
};

export const getModuleIcon = (completed: boolean, canStart: boolean) => {
  if (completed) return <CircleCheck className="w-5 h-5 text-[hsl(var(--success))]" />;
  if (canStart) return <PlayCircle className="w-5 h-5 text-primary" />;
  return <Lock className="w-5 h-5 text-muted-foreground" />;
};
