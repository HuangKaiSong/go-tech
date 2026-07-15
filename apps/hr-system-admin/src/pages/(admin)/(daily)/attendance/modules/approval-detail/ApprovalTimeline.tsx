import { SvgIcon } from '@go-tech/web-ui-compose';
import { Card, Tag, Timeline } from 'antd';
import { useTranslation } from 'react-i18next';

import { stepActionRecord, stepActionTagColorRecord, stepStatusColorRecord, stepStatusIconRecord } from './shared';

type ApprovalStep = Api.Attendance.ApprovalStep;

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
}

export const ApprovalTimeline = ({ steps }: ApprovalTimelineProps) => {
  const { t } = useTranslation();

  const items = steps.map(step => ({
    color: stepStatusColorRecord[step.status],
    dot: <SvgIcon icon={stepStatusIconRecord[step.status]} style={{ color: stepStatusColorRecord[step.status] }} />,
    children: (
      <div className="pb-8px">
        <p className="text-sm font-medium">{step.nodeName}</p>
        {step.approver && (
          <p className="mt-2px text-12px text-gray-400">
            {step.approver}
            {step.role ? ` · ${step.role}` : ''}
          </p>
        )}
        {step.action && (
          <div className="mt-6px">
            <Tag color={stepActionTagColorRecord[step.action]}>{t(stepActionRecord.action[step.action])}</Tag>
          </div>
        )}
        {step.time && <p className="mt-4px text-12px text-gray-400">{step.time}</p>}
        {step.comment && (
          <div className="mt-8px rounded-6px bg-gray-50 p-8px">
            <p className="text-12px leading-relaxed">{step.comment}</p>
          </div>
        )}
        {step.status === 'current' && !step.action && (
          <p className="mt-4px text-12px font-medium text-warning">等待審批中...</p>
        )}
      </div>
    )
  }));

  return (
    <Card
      className="card-wrapper"
      title={
        <span className="flex items-center gap-6px">
          <SvgIcon className="text-primary" icon="lucide:clock" />
          審批流程
        </span>
      }
      variant="borderless"
    >
      <Timeline items={items} />
    </Card>
  );
};
