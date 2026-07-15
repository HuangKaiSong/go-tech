import { SvgIcon } from '@go-tech/web-ui-compose';
import { Input, Modal, Select, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

import { approvalStatusRecord, approvalTypeRecord } from '../shared';

import { type ActionType, TRANSFER_TARGETS } from './shared';

type ApprovalDetail = Api.Attendance.ApprovalDetail;

export interface ActionConfig {
  danger?: boolean;
  desc: string;
  handler: () => void;
  okLabel: string;
  title: string;
}

const titleIconRecord: Record<Exclude<ActionType, null>, { color: string; icon: string }> = {
  approve: { color: '#52c41a', icon: 'lucide:check-circle-2' },
  reject: { color: '#ff4d4f', icon: 'lucide:x-circle' },
  returnModify: { color: '#faad14', icon: 'lucide:alert-triangle' },
  transfer: { color: '#1677ff', icon: 'lucide:send' },
  withdraw: { color: '#8c8c8c', icon: 'lucide:rotate-ccw' }
};

const commentPlaceholderRecord: Partial<Record<Exclude<ActionType, null>, string>> = {
  reject: '請說明駁回原因...',
  returnModify: '請說明需修改的內容...'
};

const isReasonAction = (action: ActionType) => action === 'reject' || action === 'returnModify';
const isPreviewAction = (action: ActionType) => action === 'approve' || action === 'reject';

interface ApprovalActionDialogProps {
  actionConfigs: Record<string, ActionConfig>;
  approvalComment: string;
  currentStepIndex: number;
  data: ApprovalDetail;
  dialog: ActionType;
  onClose: () => void;
  onCommentChange: (value: string) => void;
  onTransferToChange: (value: string) => void;
  transferTo: string;
}

export const ApprovalActionDialog = ({
  actionConfigs,
  approvalComment,
  currentStepIndex,
  data,
  dialog,
  onClose,
  onCommentChange,
  onTransferToChange,
  transferTo
}: ApprovalActionDialogProps) => {
  const { t } = useTranslation();

  if (!dialog || !actionConfigs[dialog]) return null;

  const cfg = actionConfigs[dialog];
  const { color: iconColor, icon } = titleIconRecord[dialog];
  const commentLabel = isReasonAction(dialog) ? '駁回/退回原因' : '備註（選填）';
  const commentPlaceholder = commentPlaceholderRecord[dialog] ?? '請輸入備註...';
  const showPreview = isPreviewAction(dialog);
  const reachesFinal = dialog === 'approve' && currentStepIndex >= data.steps.length - 2;
  const nextNode = data.steps[currentStepIndex + 1];

  return (
    <Modal
      okButtonProps={{ danger: cfg.danger }}
      okText={cfg.okLabel}
      open
      title={
        <span className="flex items-center gap-6px">
          <SvgIcon icon={icon} style={{ color: iconColor }} />
          {cfg.title}
        </span>
      }
      onCancel={onClose}
      onOk={cfg.handler}
    >
      <p className="mb-12px text-sm text-gray-500">{cfg.desc}</p>

      <div className="mb-12px rounded-8px bg-gray-50 p-12px">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{data.code}</span>
          <Tag>{t(approvalTypeRecord.type[data.type])}</Tag>
        </div>
        <p className="mt-4px text-sm font-medium">
          {data.applicant} — {data.summary}
        </p>
      </div>

      {dialog === 'transfer' && (
        <div className="mb-12px">
          <p className="mb-6px text-sm font-medium">轉簽對象</p>
          <Select
            className="w-full"
            options={TRANSFER_TARGETS}
            placeholder="請選擇轉簽對象"
            value={transferTo || undefined}
            onChange={onTransferToChange}
          />
        </div>
      )}

      <div className="mb-12px">
        <p className="mb-6px text-sm text-gray-500">{commentLabel}</p>
        <Input.TextArea
          placeholder={commentPlaceholder}
          rows={3}
          value={approvalComment}
          onChange={event => onCommentChange(event.target.value)}
        />
      </div>

      {showPreview && (
        <div className="rounded-8px bg-gray-50 p-12px">
          <p className="mb-8px text-12px font-medium text-gray-400">狀態流轉預覽</p>
          <div className="flex items-center gap-8px text-sm">
            <Tag color="warning">{t(approvalStatusRecord.status.pending)}</Tag>
            <SvgIcon className="text-gray-400" icon="lucide:arrow-right" />
            {dialog === 'reject' && <Tag color="error">{t(approvalStatusRecord.status.rejected)}</Tag>}
            {dialog === 'approve' && !reachesFinal && <Tag color="warning">{nextNode?.nodeName}</Tag>}
            {dialog === 'approve' && reachesFinal && (
              <Tag color="success">{t(approvalStatusRecord.status.approved)}</Tag>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
