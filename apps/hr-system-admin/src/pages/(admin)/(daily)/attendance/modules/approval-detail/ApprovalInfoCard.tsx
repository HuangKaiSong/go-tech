import { SvgIcon } from '@go-tech/web-ui-compose';
import { Card, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

import { approvalTypeRecord } from '../shared';

import { BADGE_KEYWORDS, BOLD_KEYWORDS, matchesAny } from './shared';

type ApprovalDetail = Api.Attendance.ApprovalDetail;

interface DetailFieldProps {
  fieldKey: string;
  value: string;
}

const DetailField = ({ fieldKey, value }: DetailFieldProps) => {
  const isBold = matchesAny(fieldKey, BOLD_KEYWORDS);
  const isBadge = !isBold && matchesAny(fieldKey, BADGE_KEYWORDS);

  return (
    <div>
      <p className="mb-4px text-12px text-gray-400">{fieldKey}</p>
      {isBold && <p className="text-sm font-bold text-primary">{value}</p>}
      {isBadge && <Tag>{value}</Tag>}
      {!isBold && !isBadge && <p className="text-sm font-medium">{value}</p>}
    </div>
  );
};

interface ApprovalInfoCardProps {
  data: ApprovalDetail;
}

export const ApprovalInfoCard = ({ data }: ApprovalInfoCardProps) => {
  const { t } = useTranslation();
  const detailEntries = Object.entries(data.details);
  const reasonEntry = detailEntries.find(([key]) => key.includes('事由'));
  const infoEntries = detailEntries.filter(([key]) => !key.includes('事由'));

  return (
    <Card
      className="card-wrapper"
      title={
        <span className="flex items-center gap-6px">
          <SvgIcon className="text-primary" icon="lucide:file-text" />
          {t(approvalTypeRecord.type[data.type])}資訊
        </span>
      }
      variant="borderless"
    >
      <div className="grid grid-cols-2 gap-x-24px gap-y-16px md:grid-cols-3">
        <div>
          <p className="mb-4px text-12px text-gray-400">申請人</p>
          <p className="flex items-center gap-4px text-sm font-medium">
            <SvgIcon className="text-gray-400" icon="lucide:user" />
            {data.applicant}
          </p>
        </div>
        <div>
          <p className="mb-4px text-12px text-gray-400">部門</p>
          <p className="flex items-center gap-4px text-sm font-medium">
            <SvgIcon className="text-gray-400" icon="lucide:building-2" />
            {data.department}
          </p>
        </div>
        <div>
          <p className="mb-4px text-12px text-gray-400">職位</p>
          <p className="text-sm font-medium">{data.position}</p>
        </div>
        {infoEntries.map(([key, value]) => (
          <DetailField fieldKey={key} key={key} value={value} />
        ))}
      </div>

      {reasonEntry && (
        <>
          <Divider className="my-16px" />
          <div>
            <p className="mb-4px text-12px text-gray-400">{reasonEntry[0]}</p>
            <p className="text-sm leading-relaxed">{reasonEntry[1]}</p>
          </div>
        </>
      )}

      {data.attachments.length > 0 && (
        <>
          <Divider className="my-16px" />
          <div>
            <p className="mb-8px text-12px text-gray-400">附件</p>
            <div className="flex flex-col gap-4px">
              {data.attachments.map(file => (
                <div className="flex cursor-pointer items-center gap-6px text-sm text-primary hover:underline" key={file}>
                  <SvgIcon icon="lucide:paperclip" />
                  {file}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
