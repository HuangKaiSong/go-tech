import { SvgIcon } from '@go-tech/web-ui-compose';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

type ApprovalStatus = Api.Attendance.ApprovalStatus;

const STATUS_CARD_STATUSES = ['approved', 'rejected', 'withdrawn'] as const;

type StatusCardStatus = (typeof STATUS_CARD_STATUSES)[number];

const iconRecord: Record<StatusCardStatus, string> = {
  approved: 'lucide:check-circle-2',
  rejected: 'lucide:x-circle',
  withdrawn: 'lucide:rotate-ccw'
};

const iconColorRecord: Record<StatusCardStatus, string> = {
  approved: '#52c41a',
  rejected: '#ff4d4f',
  withdrawn: '#8c8c8c'
};

const titleKeyRecord: Record<StatusCardStatus, I18n.I18nKey> = {
  approved: 'page.attendance.approval.statusCard.approved.title',
  rejected: 'page.attendance.approval.statusCard.rejected.title',
  withdrawn: 'page.attendance.approval.statusCard.withdrawn.title'
};

const descKeyRecord: Record<StatusCardStatus, I18n.I18nKey> = {
  approved: 'page.attendance.approval.statusCard.approved.desc',
  rejected: 'page.attendance.approval.statusCard.rejected.desc',
  withdrawn: 'page.attendance.approval.statusCard.withdrawn.desc'
};

function isStatusCardStatus(status: ApprovalStatus): status is StatusCardStatus {
  return (STATUS_CARD_STATUSES as readonly string[]).includes(status);
}

interface ApprovalStatusCardProps {
  status: ApprovalStatus;
}

export const ApprovalStatusCard = ({ status }: ApprovalStatusCardProps) => {
  const { t } = useTranslation();

  if (!isStatusCardStatus(status)) return null;

  return (
    <Card className="card-wrapper" variant="borderless">
      <div className="flex items-center gap-12px">
        <div className="flex-center h-40px w-40px rounded-8px" style={{ backgroundColor: `${iconColorRecord[status]}1a` }}>
          <SvgIcon icon={iconRecord[status]} style={{ color: iconColorRecord[status] }} />
        </div>
        <div>
          <p className="text-sm font-medium">{t(titleKeyRecord[status])}</p>
          <p className="mt-2px text-12px text-gray-400">{t(descKeyRecord[status])}</p>
        </div>
      </div>
    </Card>
  );
};
