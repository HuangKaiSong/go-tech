import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { progressBarColor, stepIndicatorStyle } from './constants';
import type { ApprovalData, ApprovalStep } from './types';

interface StepIndicatorProps {
  index: number;
  isLast: boolean;
  step: ApprovalStep;
}

const StepIndicator = ({ index, isLast, step }: StepIndicatorProps) => {
  const isActive = step.status === 'current';
  const isDone = step.status === 'completed';
  const isRejected = step.status === 'rejected';
  const nodeLabel = step.nodeName.length > 6 ? `${step.nodeName.slice(0, 6)}…` : step.nodeName;
  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${stepIndicatorStyle[step.status]}`}
        >
          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
          {isRejected && <XCircle className="h-3.5 w-3.5" />}
          {!isDone && !isRejected && index + 1}
        </div>
        <span
          className={`text-xs mt-1 max-w-16 text-center leading-tight ${isActive ? 'text-warning font-medium' : 'text-muted-foreground'}`}
        >
          {nodeLabel}
        </span>
      </div>
      {!isLast && <div className={`flex-1 h-0.5 mx-1 mt-[-16px] ${isDone ? 'bg-success' : 'bg-border'}`} />}
    </div>
  );
};

interface ApprovalProgressProps {
  data: ApprovalData;
}

export const ApprovalProgress = ({ data }: ApprovalProgressProps) => {
  const completedSteps = data.steps.filter(s => s.status === 'completed').length;
  const totalSteps = data.steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const barColor = progressBarColor[data.status] ?? 'bg-success';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">審批進度</p>
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{totalSteps} 節點已完成
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          {data.steps.map((step, i) => (
            <StepIndicator key={step.id} step={step} index={i} isLast={i === data.steps.length - 1} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
