import { SvgIcon } from '@go-tech/web-ui-compose';
import { Card, Progress } from 'antd';

import { stepStatusColorRecord } from './shared';

type ApprovalDetail = Api.Attendance.ApprovalDetail;
type ApprovalStep = Api.Attendance.ApprovalStep;

const progressBarColorRecord: Partial<Record<Api.Attendance.ApprovalStatus, string>> = {
  rejected: '#ff4d4f',
  withdrawn: '#8c8c8c'
};

interface StepIndicatorProps {
  index: number;
  isLast: boolean;
  step: ApprovalStep;
}

const StepIndicator = ({ index, isLast, step }: StepIndicatorProps) => {
  const isDone = step.status === 'completed';
  const isRejected = step.status === 'rejected';
  const isActive = step.status === 'current';
  const nodeLabel = step.nodeName.length > 6 ? `${step.nodeName.slice(0, 6)}…` : step.nodeName;
  const color = stepStatusColorRecord[step.status];

  return (
    <div className="flex flex-1 items-center">
      <div className="flex shrink-0 flex-col items-center">
        <div
          className="h-24px w-24px flex-center rounded-full text-12px font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {isDone && <SvgIcon icon="lucide:check" />}
          {isRejected && <SvgIcon icon="lucide:x" />}
          {!isDone && !isRejected && index + 1}
        </div>
        <span
          className="mt-4px max-w-64px text-center text-12px leading-tight"
          style={{ color: isActive ? '#faad14' : '#8c8c8c' }}
        >
          {nodeLabel}
        </span>
      </div>
      {!isLast && (
        <div
          className="mt-[-16px] h-2px flex-1"
          style={{ backgroundColor: isDone ? '#52c41a' : '#e5e5e5' }}
        />
      )}
    </div>
  );
};

interface ApprovalProgressProps {
  data: ApprovalDetail;
}

export const ApprovalProgress = ({ data }: ApprovalProgressProps) => {
  const completedSteps = data.steps.filter(step => step.status === 'completed').length;
  const totalSteps = data.steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const barColor = progressBarColorRecord[data.status] ?? '#52c41a';

  return (
    <Card className="card-wrapper" variant="borderless">
      <div className="mb-8px flex items-center justify-between">
        <span className="text-sm font-medium">審批進度</span>
        <span className="text-sm text-gray-500">
          {completedSteps}/{totalSteps} 節點已完成
        </span>
      </div>
      <Progress percent={progressPercent} showInfo={false} strokeColor={barColor} />
      <div className="mt-12px flex items-center justify-between px-4px">
        {data.steps.map((step, index) => (
          <StepIndicator index={index} isLast={index === data.steps.length - 1} key={step.id} step={step} />
        ))}
      </div>
    </Card>
  );
};
