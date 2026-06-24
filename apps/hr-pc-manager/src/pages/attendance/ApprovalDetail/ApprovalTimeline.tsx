import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { actionBadgeStyles, stepLineStyle, stepStatusStyle } from './constants';
import type { ApprovalStep, StepStatus } from './types';

const stepIconMap: Record<StepStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  rejected: XCircle,
  current: Clock,
  pending: FileText
};

interface TimelineStepProps {
  isLast: boolean;
  step: ApprovalStep;
}

const TimelineStep = ({ isLast, step }: TimelineStepProps) => {
  const StepIcon = stepIconMap[step.status] ?? FileText;
  const badgeClass = step.action ? (actionBadgeStyles[step.action] ?? 'bg-muted text-muted-foreground') : '';
  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] ${stepLineStyle[step.status]}`} />
      )}
      <div
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${stepStatusStyle[step.status]}`}
      >
        <StepIcon className="h-4 w-4" />
      </div>
      <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <p className="text-sm font-medium text-foreground">{step.nodeName}</p>
        {step.approver && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {step.approver}
            {step.role ? ` · ${step.role}` : ''}
          </p>
        )}
        {step.action && (
          <div className="mt-1.5">
            <Badge variant="outline" className={`text-xs ${badgeClass}`}>
              {step.action}
            </Badge>
          </div>
        )}
        {step.time && <p className="text-xs text-muted-foreground mt-1">{step.time}</p>}
        {step.comment && (
          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border">
            <p className="text-xs text-foreground leading-relaxed">{step.comment}</p>
          </div>
        )}
        {step.status === 'current' && !step.action && (
          <p className="text-xs text-warning mt-1 font-medium">等待審批中...</p>
        )}
      </div>
    </div>
  );
};

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
}

export const ApprovalTimeline = ({ steps }: ApprovalTimelineProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        審批流程
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="relative">
        {steps.map((step, index) => (
          <TimelineStep key={step.id} step={step} isLast={index === steps.length - 1} />
        ))}
      </div>
    </CardContent>
  </Card>
);
