import { SvgIcon } from '@go-tech/web-ui-compose';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { App, Button, Card, Col, Divider, Flex, Input, InputNumber, Row, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApprovalRuleDetailQuery } from '@/service/api';
import { translateOptions } from '@/utils/common';

import { approvalTypeOptions } from '../shared';

import {
  CONDITION_FIELDS,
  OPERATORS,
  SCOPE_OPTIONS,
  approverTypeOptions,
  overtimeHandlingOptions
} from './shared';

interface LevelForm {
  approver: string;
  approverType: Api.Attendance.ApproverType;
  condition: string;
  id: string;
  name: string;
}

interface ConditionForm {
  action: string;
  field: string;
  id: string;
  operator: string;
  value: string;
}

let uid = 0;
const genId = () => `tmp-${(uid += 1)}`;

interface ApprovalRuleFormViewProps {
  ruleId?: string;
}

const ApprovalRuleFormView = ({ ruleId }: ApprovalRuleFormViewProps) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const router = useRouter();
  const isEdit = Boolean(ruleId);

  const { data: detail } = useApprovalRuleDetailQuery(ruleId ?? '', { enabled: isEdit });

  const [name, setName] = useState('');
  const [type, setType] = useState<Api.Attendance.ApprovalType | undefined>();
  const [scope, setScope] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState<LevelForm[]>([
    { approver: '', approverType: 'directManager', condition: '', id: genId(), name: '' }
  ]);
  const [conditions, setConditions] = useState<ConditionForm[]>([]);
  const [timeLimit, setTimeLimit] = useState<number>(48);
  const [overtimeAction, setOvertimeAction] = useState<Api.Attendance.OvertimeHandling>('remind');
  const [allowWithdraw, setAllowWithdraw] = useState(true);
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [notifyNextApprover, setNotifyNextApprover] = useState(true);

  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setType(detail.type);
    setScope(detail.applyScope);
    setDescription(detail.description);
    setEnabled(detail.enabled);
    setLevels(
      detail.levels.map(level => ({
        approver: level.approver,
        approverType: level.approverType,
        condition: level.condition ?? '',
        id: genId(),
        name: level.name
      }))
    );
    setConditions(
      detail.conditions.map(condition => ({
        action: condition.action,
        field: condition.label,
        id: genId(),
        operator: condition.operator,
        value: condition.value
      }))
    );
    setTimeLimit(detail.settings.timeLimit);
    setOvertimeAction(detail.settings.overtimeAction);
    setAllowWithdraw(detail.settings.allowWithdraw);
    setNotifyApplicant(detail.settings.notifyApplicant);
    setNotifyNextApprover(detail.settings.notifyNextApprover);
  }, [detail]);

  const availableFields = type ? (CONDITION_FIELDS[type] ?? []).map(value => ({ label: value, value })) : [];

  function addLevel() {
    setLevels(prev => [...prev, { approver: '', approverType: 'directManager', condition: '', id: genId(), name: '' }]);
  }
  function removeLevel(id: string) {
    setLevels(prev => prev.filter(item => item.id !== id));
  }
  function updateLevel(id: string, key: keyof LevelForm, value: string) {
    setLevels(prev => prev.map(item => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addCondition() {
    setConditions(prev => [...prev, { action: '', field: '', id: genId(), operator: '=', value: '' }]);
  }
  function removeCondition(id: string) {
    setConditions(prev => prev.filter(item => item.id !== id));
  }
  function updateCondition(id: string, key: keyof ConditionForm, value: string) {
    setConditions(prev => prev.map(item => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function handleSave() {
    if (!name || !type || !scope) {
      message.error('請填寫必填欄位');
      return;
    }
    if (levels.length === 0) {
      message.error('請至少新增一個審批層級');
      return;
    }
    message.success(isEdit ? '審批規則已更新' : '審批規則已建立');
    navigate({ to: '/attendance/approval' });
  }

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12px">
          <Button icon={<SvgIcon icon="lucide:arrow-left" />} type="text" onClick={() => router.history.back()} />
          <div>
            <h1 className="text-xl font-bold">{isEdit ? '編輯審批規則' : '新增審批規則'}</h1>
            <p className="mt-2px text-12px text-gray-400">設定審批流程的層級、條件與通知規則</p>
          </div>
        </div>
        <Flex align="center" gap={12}>
          <span className="text-sm text-gray-400">{enabled ? '啟用' : '停用'}</span>
          <Switch checked={enabled} onChange={setEnabled} />
          <Button onClick={() => router.history.back()}>{t('common.cancel')}</Button>
          <Button icon={<SvgIcon icon="lucide:save" />} type="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
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
              <Row gutter={[16, 16]}>
                <Col md={12} span={24}>
                  <p className="mb-6px text-sm">
                    規則名稱 <span className="text-red-500">*</span>
                  </p>
                  <Input placeholder="例如：請假審批流程" value={name} onChange={event => setName(event.target.value)} />
                </Col>
                <Col md={12} span={24}>
                  <p className="mb-6px text-sm">
                    申請類型 <span className="text-red-500">*</span>
                  </p>
                  <Select
                    className="w-full"
                    options={translateOptions(approvalTypeOptions)}
                    placeholder="選擇類型"
                    value={type}
                    onChange={setType}
                  />
                </Col>
                <Col md={12} span={24}>
                  <p className="mb-6px text-sm">
                    適用範圍 <span className="text-red-500">*</span>
                  </p>
                  <Select
                    className="w-full"
                    options={SCOPE_OPTIONS}
                    placeholder="選擇範圍"
                    value={scope}
                    onChange={setScope}
                  />
                </Col>
                <Col span={24}>
                  <p className="mb-6px text-sm">規則描述</p>
                  <Input.TextArea
                    placeholder="描述此審批規則的用途..."
                    rows={2}
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              className="card-wrapper"
              extra={
                <Button icon={<SvgIcon icon="ic:round-plus" />} onClick={addLevel}>
                  新增層級
                </Button>
              }
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-primary" icon="lucide:git-branch" />
                  審批層級
                </span>
              }
              variant="borderless"
            >
              <div className="flex flex-col gap-12px">
                {levels.map((level, index) => (
                  <div className="rounded-8px bg-gray-50 p-12px" key={level.id}>
                    <div className="mb-8px flex items-center justify-between">
                      <span className="text-sm font-medium">第 {index + 1} 級</span>
                      {levels.length > 1 && (
                        <Button
                          danger
                          icon={<SvgIcon icon="lucide:trash-2" />}
                          size="small"
                          type="text"
                          onClick={() => removeLevel(level.id)}
                        />
                      )}
                    </div>
                    <Row gutter={[12, 12]}>
                      <Col md={8} span={24}>
                        <p className="mb-4px text-12px text-gray-400">節點名稱</p>
                        <Input
                          placeholder="例如：部門主管審批"
                          value={level.name}
                          onChange={event => updateLevel(level.id, 'name', event.target.value)}
                        />
                      </Col>
                      <Col md={8} span={24}>
                        <p className="mb-4px text-12px text-gray-400">審批人類型</p>
                        <Select
                          className="w-full"
                          options={translateOptions(approverTypeOptions)}
                          value={level.approverType}
                          onChange={value => updateLevel(level.id, 'approverType', value)}
                        />
                      </Col>
                      <Col md={8} span={24}>
                        <p className="mb-4px text-12px text-gray-400">審批人</p>
                        <Input
                          placeholder="人員/角色名稱"
                          value={level.approver}
                          onChange={event => updateLevel(level.id, 'approver', event.target.value)}
                        />
                      </Col>
                      <Col span={24}>
                        <p className="mb-4px text-12px text-gray-400">觸發條件（選填）</p>
                        <Input
                          placeholder="例如：金額 > 30,000 時觸發此層級"
                          value={level.condition}
                          onChange={event => updateLevel(level.id, 'condition', event.target.value)}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              className="card-wrapper"
              extra={
                <Button disabled={!type} icon={<SvgIcon icon="ic:round-plus" />} onClick={addCondition}>
                  新增條件
                </Button>
              }
              title={
                <span className="flex items-center gap-6px">
                  <SvgIcon className="text-warning" icon="lucide:alert-triangle" />
                  條件規則
                </span>
              }
              variant="borderless"
            >
              {!type && <p className="text-sm text-gray-400">請先選擇申請類型以設定條件規則</p>}
              <div className="flex flex-col gap-12px">
                {conditions.map(condition => (
                  <Flex align="end" className="rounded-8px bg-gray-50 p-12px" gap={8} key={condition.id}>
                    <div className="flex-1">
                      <p className="mb-4px text-12px text-gray-400">欄位</p>
                      <Select
                        className="w-full"
                        options={availableFields}
                        placeholder="選擇"
                        value={condition.field || undefined}
                        onChange={value => updateCondition(condition.id, 'field', value)}
                      />
                    </div>
                    <div className="w-72px">
                      <p className="mb-4px text-12px text-gray-400">運算</p>
                      <Select
                        className="w-full"
                        options={OPERATORS}
                        value={condition.operator}
                        onChange={value => updateCondition(condition.id, 'operator', value)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="mb-4px text-12px text-gray-400">值</p>
                      <Input
                        placeholder="條件值"
                        value={condition.value}
                        onChange={event => updateCondition(condition.id, 'value', event.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="mb-4px text-12px text-gray-400">動作</p>
                      <Input
                        placeholder="觸發動作"
                        value={condition.action}
                        onChange={event => updateCondition(condition.id, 'action', event.target.value)}
                      />
                    </div>
                    <Button
                      danger
                      icon={<SvgIcon icon="lucide:trash-2" />}
                      type="text"
                      onClick={() => removeCondition(condition.id)}
                    />
                  </Flex>
                ))}
                {conditions.length === 0 && type && (
                  <p className="py-16px text-center text-sm text-gray-400">
                    尚未設定條件規則，所有申請將走完整審批流程
                  </p>
                )}
              </div>
            </Card>
          </div>
        </Col>

        <Col lg={8} span={24}>
          <Card className="card-wrapper" title="流程設定" variant="borderless">
            <p className="mb-6px text-sm">審批時限（小時）</p>
            <InputNumber
              className="w-full"
              min={0}
              value={timeLimit}
              onChange={value => setTimeLimit(value ?? 0)}
            />
            <p className="mb-6px mt-16px text-sm">超時處理</p>
            <Select
              className="w-full"
              options={translateOptions(overtimeHandlingOptions)}
              value={overtimeAction}
              onChange={setOvertimeAction}
            />
            <Divider className="my-16px" />
            <Flex className="mb-12px" justify="space-between">
              <span className="text-sm">允許撤回</span>
              <Switch checked={allowWithdraw} onChange={setAllowWithdraw} />
            </Flex>
            <Flex className="mb-12px" justify="space-between">
              <span className="text-sm">通知申請人</span>
              <Switch checked={notifyApplicant} onChange={setNotifyApplicant} />
            </Flex>
            <Flex justify="space-between">
              <span className="text-sm">通知下一審批人</span>
              <Switch checked={notifyNextApprover} onChange={setNotifyNextApprover} />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ApprovalRuleFormView;
