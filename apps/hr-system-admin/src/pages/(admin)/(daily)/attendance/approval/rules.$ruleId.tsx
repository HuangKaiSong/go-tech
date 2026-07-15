import { SvgIcon } from '@go-tech/web-ui-compose';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Badge, Button, Card, Col, Divider, Empty, Flex, Row, Switch, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApprovalRuleDetailQuery } from '@/service/api';

import { approvalTypeRecord, approvalTypeTagColorRecord } from '../modules/shared';
import { approverTypeRecord, overtimeHandlingRecord } from '../modules/approval-rule/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/approval/rules/$ruleId')({
  component: RouteComponent,
  staticData: {
    menu: {
      hide: true
    },
    title: '審批規則詳情'
  }
});

function RouteComponent() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { ruleId } = Route.useParams();

  const { data } = useApprovalRuleDetailQuery(ruleId);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (data) setEnabled(data.enabled);
  }, [data]);

  function backToList() {
    navigate({ to: '/attendance/approval' });
  }

  if (!data) {
    return (
      <div className="h-full flex-center flex-col gap-16px py-80px">
        <Empty description="找不到該審批規則" />
        <Button icon={<SvgIcon icon="lucide:arrow-left" />} onClick={backToList}>
          返回審批管理
        </Button>
      </div>
    );
  }

  function handleToggle(value: boolean) {
    setEnabled(value);
    message.success(value ? '規則已啟用' : '規則已停用');
  }

  const settingRows: { label: string; value: React.ReactNode }[] = [
    { label: '允許撤回', value: <Badge status={data.settings.allowWithdraw ? 'success' : 'default'} text={data.settings.allowWithdraw ? '是' : '否'} /> },
    { label: '審批時限', value: <span className="font-medium">{data.settings.timeLimit} 小時</span> },
    { label: '超時處理', value: <Tag>{t(overtimeHandlingRecord.action[data.settings.overtimeAction])}</Tag> },
    { label: '通知申請人', value: <Badge status={data.settings.notifyApplicant ? 'success' : 'default'} text={data.settings.notifyApplicant ? '是' : '否'} /> },
    { label: '通知下一審批人', value: <Badge status={data.settings.notifyNextApprover ? 'success' : 'default'} text={data.settings.notifyNextApprover ? '是' : '否'} /> },
    { label: '自動審批', value: <Badge status={data.settings.autoApprove ? 'success' : 'default'} text={data.settings.autoApprove ? '已啟用' : '未啟用'} /> }
  ];

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12px">
          <Button icon={<SvgIcon icon="lucide:arrow-left" />} type="text" onClick={backToList} />
          <div>
            <h1 className="text-xl font-bold">{data.name}</h1>
            <p className="mt-2px text-12px text-gray-400">{data.description}</p>
          </div>
        </div>
        <Flex align="center" gap={12}>
          <span className="text-sm text-gray-400">{enabled ? '已啟用' : '已停用'}</span>
          <Switch checked={enabled} onChange={handleToggle} />
          <Button
            icon={<SvgIcon icon="lucide:edit" />}
            onClick={() => navigate({ params: { ruleId }, to: '/attendance/approval/rules/$ruleId/edit' })}
          >
            {t('common.edit')}
          </Button>
          <Button
            danger
            icon={<SvgIcon icon="lucide:trash-2" />}
            onClick={() => {
              message.success('規則已刪除');
              backToList();
            }}
          />
        </Flex>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={16} span={24}>
          <div className="flex flex-col gap-16px">
            <Card
              className="card-wrapper"
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-primary" icon="lucide:settings-2" />
                  基本資訊
                </span>
              }
              variant="borderless"
            >
              <Row gutter={[24, 16]}>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">申請類型</p>
                  <Tag color={approvalTypeTagColorRecord[data.type]}>{t(approvalTypeRecord.type[data.type])}</Tag>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">適用範圍</p>
                  <p className="text-sm font-medium">{data.applyScope}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">審批層級</p>
                  <Tag>{data.levels.length} 級</Tag>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">建立者</p>
                  <p className="text-sm">{data.creator}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">建立時間</p>
                  <p className="text-sm">{data.createdAt}</p>
                </Col>
                <Col md={8} span={12}>
                  <p className="mb-4px text-12px text-gray-400">最後更新</p>
                  <p className="text-sm">{data.updatedAt}</p>
                </Col>
              </Row>
            </Card>

            <Card
              className="card-wrapper"
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-primary" icon="lucide:git-branch" />
                  審批流程
                </span>
              }
              variant="borderless"
            >
              <Flex align="start" gap={8} wrap="wrap">
                <div className="h-64px w-96px flex-center flex-col rounded-8px b-2 b-primary b-solid bg-primary/5">
                  <SvgIcon className="text-primary" icon="lucide:users" />
                  <span className="mt-2px text-12px font-medium text-primary">申請人提交</span>
                </div>
                {data.levels.map(level => (
                  <Flex align="start" gap={8} key={level.level}>
                    <SvgIcon className="mt-24px text-gray-400" icon="lucide:arrow-right" />
                    <div className="w-112px rounded-8px b-2 b-gray-200 b-solid p-12px text-center">
                      <p className="text-12px font-medium">{level.name}</p>
                      <p className="mt-2px text-10px text-gray-400">
                        {t(approverTypeRecord.type[level.approverType])}：{level.approver}
                      </p>
                      {level.condition && (
                        <p className="mt-2px flex-center gap-2px text-10px text-warning">
                          <SvgIcon icon="lucide:alert-triangle" />
                          {level.condition}
                        </p>
                      )}
                    </div>
                  </Flex>
                ))}
                <Flex align="start" gap={8}>
                  <SvgIcon className="mt-24px text-gray-400" icon="lucide:arrow-right" />
                  <div className="h-64px w-96px flex-center flex-col rounded-8px b-2 b-success b-solid bg-success/5">
                    <SvgIcon className="text-success" icon="lucide:check-circle-2" />
                    <span className="mt-2px text-12px font-medium text-success">審批完成</span>
                  </div>
                </Flex>
              </Flex>
            </Card>

            <Card
              className="card-wrapper"
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-warning" icon="lucide:alert-triangle" />
                  條件規則
                </span>
              }
              variant="borderless"
            >
              <div className="flex flex-col gap-12px">
                {data.conditions.map((condition, index) => (
                  <Flex align="center" className="rounded-8px bg-gray-50 p-12px" gap={12} key={index}>
                    <Tag>{condition.label}</Tag>
                    <span className="text-sm font-mono">
                      {condition.operator} {condition.value}
                    </span>
                    <SvgIcon className="text-gray-400" icon="lucide:arrow-right" />
                    <span className="text-sm text-gray-500">{condition.action}</span>
                  </Flex>
                ))}
              </div>
            </Card>
          </div>
        </Col>

        <Col lg={8} span={24}>
          <Card className="card-wrapper" title="流程設定" variant="borderless">
            {settingRows.map((row, index) => (
              <div key={row.label}>
                <Flex justify="space-between">
                  <span className="text-sm">{row.label}</span>
                  {row.value}
                </Flex>
                {index < settingRows.length - 1 && <Divider className="my-12px" />}
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
