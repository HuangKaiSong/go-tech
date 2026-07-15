import { SvgIcon } from '@go-tech/web-ui-compose';
import { useNavigate } from '@tanstack/react-router';
import type { TableColumnsType } from 'antd';
import { Button, Card, Col, Input, Row, Statistic, Switch, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApprovalRuleListQuery } from '@/service/api';

import { approvalTypeRecord, approvalTypeTagColorRecord } from './shared';

type ApprovalRule = Api.Attendance.ApprovalRule;

const ApprovalRulesTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isFetching } = useApprovalRuleListQuery({ current: 1, size: 100 });

  const [search, setSearch] = useState('');
  const [rules, setRules] = useState<ApprovalRule[]>([]);

  useEffect(() => {
    if (data?.records) {
      setRules(data.records);
    }
  }, [data]);

  const filtered = useMemo(() => {
    return rules.filter(
      item => !search || item.name.includes(search) || item.type.includes(search) || item.applyScope.includes(search)
    );
  }, [rules, search]);

  function handleToggle(id: string, enabled: boolean) {
    setRules(prev => prev.map(item => (item.id === id ? { ...item, enabled } : item)));
    message.success(enabled ? '規則已啟用' : '規則已停用');
  }

  const columns: TableColumnsType<ApprovalRule> = [
    { align: 'center', dataIndex: 'name', key: 'name', minWidth: 160, title: '規則名稱' },
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
    { align: 'center', dataIndex: 'applyScope', key: 'applyScope', title: '適用範圍', width: 110 },
    {
      align: 'center',
      dataIndex: 'levels',
      key: 'levels',
      render: (_, record) => <Tag>{record.levels} 級</Tag>,
      title: '審批層級',
      width: 100
    },
    { align: 'center', dataIndex: 'conditions', ellipsis: true, key: 'conditions', minWidth: 200, title: '條件摘要' },
    { align: 'center', dataIndex: 'updatedAt', key: 'updatedAt', title: '更新時間', width: 120 },
    {
      align: 'center',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (_, record) => (
        <span onClick={event => event.stopPropagation()}>
          <Switch checked={record.enabled} onChange={value => handleToggle(record.id, value)} />
        </span>
      ),
      title: '狀態',
      width: 90
    }
  ];

  return (
    <div className="flex flex-col gap-16px">
      <div className="flex items-center justify-between">
        <Input
          allowClear
          placeholder="搜尋規則名稱 / 類型..."
          prefix={<SvgIcon icon="ic:round-search" />}
          style={{ width: 264 }}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <Button
          icon={<SvgIcon icon="ic:round-plus" />}
          type="primary"
          onClick={() => navigate({ to: '/attendance/approval/rules/new' })}
        >
          新增審批規則
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic prefix={<SvgIcon icon="lucide:layers" />} title="規則總數" value={rules.length} />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:settings-2" />}
              title="已啟用"
              value={rules.filter(item => item.enabled).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:git-branch" />}
              title="涵蓋類型"
              value={new Set(rules.map(item => item.type)).size}
            />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:users" />}
              title="適用範圍"
              value={new Set(rules.map(item => item.applyScope)).size}
            />
          </Card>
        </Col>
      </Row>

      <Card className="card-wrapper" variant="borderless">
        <Table
          columns={columns}
          dataSource={filtered}
          loading={isFetching}
          pagination={false}
          rowClassName="cursor-pointer"
          rowKey="id"
          scroll={{ x: 990 }}
          onRow={record => ({
            onClick: () => navigate({ params: { ruleId: record.id }, to: '/attendance/approval/rules/$ruleId' })
          })}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ApprovalRulesTab;
