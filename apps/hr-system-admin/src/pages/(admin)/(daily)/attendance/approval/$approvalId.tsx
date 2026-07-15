import { SvgIcon } from '@go-tech/web-ui-compose';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Card, Col, Empty, Input, Row, Tag } from 'antd';
import { useEffect, useState } from 'react';

import { useApprovalDetailQuery } from '@/service/api';

import {
  approveApproval,
  rejectApproval,
  returnModifyApproval,
  transferApproval,
  withdrawApproval
} from '../modules/approval-detail/actions';
import { type ActionConfig, ApprovalActionDialog } from '../modules/approval-detail/ApprovalActionDialog';
import { ApprovalInfoCard } from '../modules/approval-detail/ApprovalInfoCard';
import { ApprovalProgress } from '../modules/approval-detail/ApprovalProgress';
import { ApprovalStatusCard } from '../modules/approval-detail/ApprovalStatusCard';
import { ApprovalTimeline } from '../modules/approval-detail/ApprovalTimeline';
import type { ActionType } from '../modules/approval-detail/shared';
import { approvalStatusRecord, approvalStatusTagColorRecord, approvalTypeRecord } from '../modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/approval/$approvalId')({
  component: RouteComponent,
  staticData: {
    menu: {
      hide: true
    },
    title: '審批詳情'
  }
});

type ApprovalDetail = Api.Attendance.ApprovalDetail;

const statusIconRecord: Record<Api.Attendance.ApprovalStatus, string> = {
  approved: 'lucide:check-circle-2',
  draft: 'lucide:file-text',
  pending: 'lucide:clock',
  rejected: 'lucide:x-circle',
  withdrawn: 'lucide:rotate-ccw'
};

function RouteComponent() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { approvalId } = Route.useParams();

  const { data: fetched } = useApprovalDetailQuery(approvalId);

  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [actionDialog, setActionDialog] = useState<ActionType>(null);
  const [transferTo, setTransferTo] = useState('');

  useEffect(() => {
    setData(fetched ?? null);
  }, [fetched]);

  function backToList() {
    navigate({ to: '/attendance/approval' });
  }

  if (!data) {
    return (
      <div className="h-full flex-center flex-col gap-16px py-80px">
        <Empty description="找不到該審批記錄" />
        <Button icon={<SvgIcon icon="lucide:arrow-left" />} onClick={backToList}>
          返回審批管理
        </Button>
      </div>
    );
  }

  const isActionable = data.status === 'pending';
  const currentStepIndex = data.steps.findIndex(step => step.status === 'current');
  const typeLabel = t(approvalTypeRecord.type[data.type]);

  function closeDialog() {
    setActionDialog(null);
    setTransferTo('');
    setApprovalComment('');
  }

  function handleApprove() {
    if (currentStepIndex < 0 || !data) return;
    setData(approveApproval(data, currentStepIndex, approvalComment));
    message.success(`已核准申請 ${data.code}，流程已推進至下一節點`);
    closeDialog();
  }

  function handleReject() {
    if (currentStepIndex < 0 || !data) return;
    setData(rejectApproval(data, currentStepIndex, approvalComment));
    message.error(`已駁回申請 ${data.code}`);
    closeDialog();
  }

  function handleTransfer() {
    if (!data) return;
    if (!transferTo.trim()) {
      message.error('請選擇轉簽對象');
      return;
    }
    if (currentStepIndex < 0) return;
    setData(transferApproval(data, currentStepIndex, transferTo, approvalComment));
    message.success(`已轉簽至 ${transferTo}`);
    closeDialog();
  }

  function handleWithdraw() {
    if (!data) return;
    setData(withdrawApproval(data, approvalComment));
    message.success(`已撤回申請 ${data.code}`);
    closeDialog();
  }

  function handleReturnModify() {
    if (currentStepIndex < 0 || !data) return;
    setData(returnModifyApproval(data, currentStepIndex, approvalComment));
    message.info(`已退回 ${data.applicant} 修改`);
    closeDialog();
  }

  const actionConfigs: Record<string, ActionConfig> = {
    approve: {
      desc: `確定要核准 ${data.applicant} 的${typeLabel}嗎？`,
      handler: handleApprove,
      okLabel: '確認核准',
      title: '確認核准'
    },
    reject: {
      danger: true,
      desc: `確定要駁回 ${data.applicant} 的${typeLabel}嗎？駁回後申請流程將終止。`,
      handler: handleReject,
      okLabel: '確認駁回',
      title: '確認駁回'
    },
    returnModify: {
      desc: '將申請退回給申請人修改，修改後可重新提交。',
      handler: handleReturnModify,
      okLabel: '確認退回',
      title: '退回修改'
    },
    transfer: {
      desc: '將此申請轉交給其他審批人處理。',
      handler: handleTransfer,
      okLabel: '確認轉簽',
      title: '轉簽審批'
    },
    withdraw: {
      danger: true,
      desc: `確定要撤回申請 ${data.code}？撤回後需重新提交。`,
      handler: handleWithdraw,
      okLabel: '確認撤回',
      title: '確認撤回'
    }
  };

  return (
    <div className="h-full w-full min-h-500px flex flex-col gap-16px overflow-y-scroll">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12px">
          <Button icon={<SvgIcon icon="lucide:arrow-left" />} type="text" onClick={backToList} />
          <div>
            <h1 className="flex items-center gap-8px text-xl font-bold">
              審批詳情
              <span className="text-base font-normal text-gray-400">{data.code}</span>
            </h1>
            <p className="mt-2px text-12px text-gray-400">提交於 {data.submitTime}</p>
          </div>
        </div>
        <Tag className="flex items-center gap-4px px-12px py-4px" color={approvalStatusTagColorRecord[data.status]}>
          <SvgIcon icon={statusIconRecord[data.status]} />
          {t(approvalStatusRecord.status[data.status])}
        </Tag>
      </div>

      <ApprovalProgress data={data} />

      <Row gutter={[16, 16]} className="border-box">
        <Col lg={16} span={24}>
          <div className="flex flex-col gap-16px">
            <ApprovalInfoCard data={data} />

            {isActionable && (
              <Card
                className="card-wrapper"
                title={
                  <span className="flex items-center gap-6px">
                    <SvgIcon className="text-primary" icon="lucide:message-square" />
                    審批操作
                  </span>
                }
                variant="borderless"
              >
                <p className="mb-6px text-sm text-gray-500">審批意見</p>
                <Input.TextArea
                  className="mb-12px"
                  placeholder="請輸入審批意見（選填）..."
                  rows={3}
                  value={approvalComment}
                  onChange={event => setApprovalComment(event.target.value)}
                />
                <div className="flex flex-wrap items-center gap-12px">
                  <Button
                    icon={<SvgIcon icon="lucide:check-circle-2" />}
                    type="primary"
                    onClick={() => setActionDialog('approve')}
                  >
                    核准
                  </Button>
                  <Button danger icon={<SvgIcon icon="lucide:x-circle" />} onClick={() => setActionDialog('reject')}>
                    駁回
                  </Button>
                  <Button icon={<SvgIcon icon="lucide:send" />} onClick={() => setActionDialog('transfer')}>
                    轉簽
                  </Button>
                  <Button icon={<SvgIcon icon="lucide:arrow-right" />} onClick={() => setActionDialog('returnModify')}>
                    退回修改
                  </Button>
                </div>
              </Card>
            )}

            {isActionable && (
              <div className="flex justify-end">
                <Button danger icon={<SvgIcon icon="lucide:rotate-ccw" />} onClick={() => setActionDialog('withdraw')}>
                  撤回申請
                </Button>
              </div>
            )}

            {!isActionable && data.status !== 'draft' && <ApprovalStatusCard status={data.status} />}
          </div>
        </Col>

        <Col lg={8} span={24}>
          <ApprovalTimeline steps={data.steps} />
        </Col>
      </Row>

      <ApprovalActionDialog
        actionConfigs={actionConfigs}
        approvalComment={approvalComment}
        currentStepIndex={currentStepIndex}
        data={data}
        dialog={actionDialog}
        onClose={closeDialog}
        onCommentChange={setApprovalComment}
        onTransferToChange={setTransferTo}
        transferTo={transferTo}
      />
    </div>
  );
}
