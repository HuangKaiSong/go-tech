import { SvgIcon } from '@go-tech/web-ui-compose';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Card, Col, Divider, Empty, Input, Progress, Row, Tag } from 'antd';
import { useState } from 'react';

import { useLeaveDetailQuery } from '@/service/api';

import { ApprovalTimeline } from './modules/approval-detail/ApprovalTimeline';
import { leaveStatusRecord, leaveStatusTagColorRecord, leaveTypeRecord } from './modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/leave/$leaveId')({
  component: RouteComponent,
  staticData: {
    menu: {
      hide: true
    },
    title: '請假詳情'
  }
});

const statusIconRecord: Record<Api.Attendance.LeaveStatus, string> = {
  approved: 'lucide:check-circle-2',
  draft: 'lucide:file-text',
  pending: 'lucide:clock',
  rejected: 'lucide:x-circle',
  reviewing: 'lucide:clock',
  withdrawn: 'lucide:rotate-ccw'
};

const LEAVE_BALANCE: { total: number; type: Api.Attendance.LeaveType; used: number }[] = [
  { total: 14, type: 'annual', used: 4 },
  { total: 30, type: 'sick', used: 2 },
  { total: 14, type: 'personal', used: 3 },
  { total: 3.5, type: 'compensatory', used: 1 }
];

function RouteComponent() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { leaveId } = Route.useParams();

  const { data } = useLeaveDetailQuery(leaveId);
  const [approvalComment, setApprovalComment] = useState('');

  function backToList() {
    navigate({ to: '/attendance/leave' });
  }

  if (!data) {
    return (
      <div className="h-full flex-center flex-col gap-16px py-80px">
        <Empty description="找不到該請假記錄" />
        <Button icon={<SvgIcon icon="lucide:arrow-left" />} onClick={backToList}>
          返回請假管理
        </Button>
      </div>
    );
  }

  const isActionable = data.status === 'pending' || data.status === 'reviewing';

  function handleAction(action: string) {
    message.success(`已${action}請假申請 ${data?.code}`);
    setApprovalComment('');
    backToList();
  }

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12px">
          <Button icon={<SvgIcon icon="lucide:arrow-left" />} type="text" onClick={backToList} />
          <div>
            <h1 className="flex items-center gap-8px text-xl font-bold">
              請假詳情
              <span className="text-base font-normal text-gray-400">{data.code}</span>
            </h1>
            <p className="mt-2px text-12px text-gray-400">提交於 {data.submitTime}</p>
          </div>
        </div>
        <Tag className="flex items-center gap-4px px-12px py-4px" color={leaveStatusTagColorRecord[data.status]}>
          <SvgIcon icon={statusIconRecord[data.status]} />
          {t(leaveStatusRecord.status[data.status])}
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={16} span={24}>
          <div className="flex flex-col gap-16px">
            <Card
              className="card-wrapper"
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-primary" icon="lucide:calendar-days" />
                  請假資訊
                </span>
              }
              variant="borderless"
            >
              <Row gutter={[24, 16]}>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">申請人</p>
                  <p className="flex items-center gap-4px text-sm font-medium">
                    <SvgIcon className="text-gray-400" icon="lucide:user" />
                    {data.applicant}
                  </p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">部門</p>
                  <p className="flex items-center gap-4px text-sm font-medium">
                    <SvgIcon className="text-gray-400" icon="lucide:building-2" />
                    {data.department}
                  </p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">職位</p>
                  <p className="text-sm font-medium">{data.position}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">假別</p>
                  <Tag>{t(leaveTypeRecord.type[data.leaveType])}</Tag>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">起始日期</p>
                  <p className="text-sm font-medium">{data.startDate}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">結束日期</p>
                  <p className="text-sm font-medium">{data.endDate}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">請假天數</p>
                  <p className="text-sm font-bold text-primary">{data.days} 天</p>
                </Col>
              </Row>

              <Divider className="my-16px" />
              <div>
                <p className="mb-4px text-12px text-gray-400">請假事由</p>
                <p className="text-sm leading-relaxed">{data.reason}</p>
              </div>

              {data.attachments.length > 0 && (
                <>
                  <Divider className="my-16px" />
                  <div>
                    <p className="mb-8px text-12px text-gray-400">附件</p>
                    <div className="flex flex-col gap-4px">
                      {data.attachments.map(file => (
                        <div
                          className="flex cursor-pointer items-center gap-6px text-sm text-primary hover:underline"
                          key={file}
                        >
                          <SvgIcon icon="lucide:paperclip" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card>

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
                <div className="flex items-center gap-12px">
                  <Button icon={<SvgIcon icon="lucide:check-circle-2" />} type="primary" onClick={() => handleAction('核准')}>
                    核准
                  </Button>
                  <Button danger icon={<SvgIcon icon="lucide:x-circle" />} onClick={() => handleAction('駁回')}>
                    駁回
                  </Button>
                  <Button icon={<SvgIcon icon="lucide:send" />} onClick={() => handleAction('轉簽')}>
                    轉簽
                  </Button>
                </div>
              </Card>
            )}

            {isActionable && (
              <div className="flex justify-end">
                <Button danger icon={<SvgIcon icon="lucide:rotate-ccw" />} onClick={() => handleAction('撤回')}>
                  撤回申請
                </Button>
              </div>
            )}
          </div>
        </Col>

        <Col lg={8} span={24}>
          <div className="flex flex-col gap-16px">
            <ApprovalTimeline steps={data.steps} />

            <Card className="card-wrapper" title="假期餘額" variant="borderless">
              <div className="flex flex-col gap-12px">
                {LEAVE_BALANCE.map(item => (
                  <div key={item.type}>
                    <div className="mb-4px flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t(leaveTypeRecord.type[item.type])}</span>
                      <span className="font-medium">
                        {item.total - item.used} / {item.total} 天
                      </span>
                    </div>
                    <Progress percent={Math.round((item.used / item.total) * 100)} showInfo={false} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
