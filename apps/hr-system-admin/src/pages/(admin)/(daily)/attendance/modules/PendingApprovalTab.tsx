import { SvgIcon } from '@go-tech/web-ui-compose';
import type { TableColumnsType } from 'antd';
import { Button, Card, Col, Empty, Input, Modal, Row, Select, Space, Statistic, Table, Tag, message } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';

import { usePendingApprovalListQuery } from '@/service/api';

import { approvalTypeRecord, approvalTypeTagColorRecord } from './shared';

type PendingApproval = Api.Attendance.PendingApproval;

const urgencyLabelRecord: Record<Api.Attendance.ApprovalUrgency, string> = {
  normal: '正常',
  overdue: '超時',
  urgent: '緊急'
};

const urgencyTagColorRecord: Record<Api.Attendance.ApprovalUrgency, string> = {
  normal: 'default',
  overdue: 'error',
  urgent: 'warning'
};

const urgencyOrderRecord: Record<Api.Attendance.ApprovalUrgency, number> = {
  normal: 2,
  overdue: 0,
  urgent: 1
};

function waitingHoursColor(hours: number) {
  if (hours > 48) return '#ff4d4f';
  if (hours > 24) return '#faad14';
  return undefined;
}

const PendingApprovalTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isFetching } = usePendingApprovalListQuery({ current: 1, size: 100 });

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [sortBy, setSortBy] = useState<'time' | 'urgency'>('urgency');
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batchComment, setBatchComment] = useState('');

  const records = useMemo(() => data?.records ?? [], [data]);

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sortBy === 'urgency') {
        return urgencyOrderRecord[a.urgency] - urgencyOrderRecord[b.urgency];
      }
      return a.waitingHours > b.waitingHours ? -1 : 1;
    });
  }, [records, sortBy]);

  const urgencyCounts = {
    normal: records.filter(item => item.urgency === 'normal').length,
    overdue: records.filter(item => item.urgency === 'overdue').length,
    urgent: records.filter(item => item.urgency === 'urgent').length
  };

  const selectedRecords = sorted.filter(item => selectedRowKeys.includes(item.id));

  function handleBatchSubmit() {
    const action = batchAction === 'approve' ? '批量核准' : '批量駁回';
    message.success(`${action} ${selectedRowKeys.length} 筆申請成功`);
    setSelectedRowKeys([]);
    setBatchAction(null);
    setBatchComment('');
  }

  const columns: TableColumnsType<PendingApproval> = [
    {
      align: 'center',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (_, record) => (
        <Tag color={urgencyTagColorRecord[record.urgency]}>{urgencyLabelRecord[record.urgency]}</Tag>
      ),
      title: '緊急度',
      width: 90
    },
    { align: 'center', dataIndex: 'code', key: 'code', title: '申請編號', width: 140 },
    { align: 'center', dataIndex: 'applicant', key: 'applicant', title: '申請人', width: 100 },
    { align: 'center', dataIndex: 'department', key: 'department', title: '部門', width: 100 },
    {
      align: 'center',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => (
        <Tag color={approvalTypeTagColorRecord[record.type]}>{t(approvalTypeRecord.type[record.type])}</Tag>
      ),
      title: '申請類型',
      width: 110
    },
    { align: 'center', dataIndex: 'summary', ellipsis: true, key: 'summary', minWidth: 180, title: '摘要' },
    {
      align: 'center',
      dataIndex: 'waitingHours',
      key: 'waitingHours',
      render: (_, record) => (
        <span style={{ color: waitingHoursColor(record.waitingHours), fontWeight: 500 }}>{record.waitingHours}h</span>
      ),
      title: '等待時間',
      width: 100
    },
    { align: 'center', dataIndex: 'currentNode', key: 'currentNode', title: '當前節點', width: 140 }
  ];

  return (
    <div className="flex flex-col gap-16px">
      <Row gutter={[16, 16]}>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:alert-triangle" />}
              title="超時待審（>48h）"
              value={urgencyCounts.overdue}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:timer" />}
              title="緊急待審（24-48h）"
              value={urgencyCounts.urgent}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic prefix={<SvgIcon icon="lucide:clock" />} title="正常待審（<24h）" value={urgencyCounts.normal} />
          </Card>
        </Col>
      </Row>

      <div className="flex items-center justify-between">
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <span className="text-sm text-gray-500">已選 {selectedRowKeys.length} 項</span>
              <Button
                icon={<SvgIcon icon="lucide:check-circle-2" />}
                type="primary"
                onClick={() => setBatchAction('approve')}
              >
                批量核准
              </Button>
              <Button danger icon={<SvgIcon icon="lucide:x-circle" />} onClick={() => setBatchAction('reject')}>
                批量駁回
              </Button>
            </>
          )}
        </Space>
        <Select
          options={[
            { label: '按緊急程度', value: 'urgency' },
            { label: '按等待時間', value: 'time' }
          ]}
          style={{ width: 150 }}
          value={sortBy}
          onChange={setSortBy}
        />
      </div>

      <Card className="card-wrapper" variant="borderless">
        <Table
          columns={columns}
          dataSource={sorted}
          loading={isFetching}
          locale={{ emptyText: <Empty description="目前沒有待審批的申請 🎉" /> }}
          pagination={false}
          rowClassName="cursor-pointer"
          rowKey="id"
          rowSelection={{ onChange: setSelectedRowKeys, selectedRowKeys }}
          scroll={{ x: 1060 }}
          size="small"
          onRow={record => ({
            onClick: () => navigate({ params: { approvalId: record.code }, to: '/attendance/approval/$approvalId' })
          })}
        />
      </Card>

      <Modal
        open={Boolean(batchAction)}
        title={batchAction === 'approve' ? '批量核准' : '批量駁回'}
        onCancel={() => setBatchAction(null)}
        onOk={handleBatchSubmit}
      >
        <p className="mb-12px text-sm text-gray-500">
          即將{batchAction === 'approve' ? '核准' : '駁回'} {selectedRowKeys.length} 筆申請
        </p>
        <div className="mb-12px rounded-8px bg-gray-50 p-12px">
          {selectedRecords.map(item => (
            <div className="flex justify-between text-sm" key={item.id}>
              <span className="text-gray-500">{item.code}</span>
              <span>
                {item.applicant} - {item.summary}
              </span>
            </div>
          ))}
        </div>
        <Input.TextArea
          placeholder="請輸入審批意見（選填）..."
          rows={3}
          value={batchComment}
          onChange={event => setBatchComment(event.target.value)}
        />
      </Modal>
    </div>
  );
};

export default PendingApprovalTab;
