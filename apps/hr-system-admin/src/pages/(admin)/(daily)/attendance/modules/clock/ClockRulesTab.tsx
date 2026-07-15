import { SvgIcon } from '@go-tech/web-ui-compose';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Switch,
  Tag,
  message
} from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useClockRuleListQuery } from '@/service/api';
import { translateOptions } from '@/utils/common';

import { clockMethodOptions, clockMethodRecord } from './shared';

type ClockRule = Api.Attendance.ClockRule;

const EMPTY_RULE: ClockRule = {
  allowMethods: ['gps'],
  allowRemote: false,
  appealDeadlineDays: 3,
  enabled: true,
  id: '',
  missedClockAllowAppeal: true,
  name: '',
  overtimeAuto: true,
  overtimeMinMinutes: 30,
  remoteApproval: false,
  requireLocation: true,
  requirePhoto: false
};

const ClockRulesTab = () => {
  const { t } = useTranslation();
  const { data, isFetching } = useClockRuleListQuery({ current: 1, size: 100 });

  const [rules, setRules] = useState<ClockRule[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<ClockRule>();

  const allowRemote = Form.useWatch('allowRemote', form);
  const overtimeAuto = Form.useWatch('overtimeAuto', form);
  const missedClockAllowAppeal = Form.useWatch('missedClockAllowAppeal', form);

  useEffect(() => {
    if (data?.records) setRules(data.records);
  }, [data]);

  function openDrawer(record?: ClockRule) {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.setFieldsValue({ ...EMPTY_RULE, id: `R${Date.now()}` });
    }
    setOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setRules(prev =>
      editingId ? prev.map(item => (item.id === editingId ? { ...item, ...values } : item)) : [...prev, values]
    );
    message.success(editingId ? t('common.updateSuccess') : t('common.addSuccess'));
    setOpen(false);
  }

  function handleDelete(id: string) {
    setRules(prev => prev.filter(item => item.id !== id));
    message.success(t('common.deleteSuccess'));
  }

  function methodLabel(method: string) {
    const key = clockMethodRecord.method[method as keyof typeof clockMethodRecord.method];
    return key ? t(key) : method;
  }

  return (
    <Card
      className="card-wrapper"
      extra={
        <Button icon={<SvgIcon className="text-icon" icon="ic:round-plus" />} type="primary" onClick={() => openDrawer()}>
          新增規則
        </Button>
      }
      loading={isFetching}
      title="打卡規則列表"
      variant="borderless"
    >
      <Row gutter={[16, 16]}>
        {rules.map(rule => (
          <Col key={rule.id} span={24}>
            <Card size="small" variant="outlined">
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={8}>
                  <span className="font-semibold">{rule.name}</span>
                  <Tag color={rule.enabled ? 'success' : 'default'}>{rule.enabled ? '啟用' : '停用'}</Tag>
                </Flex>
                <Space>
                  <Button size="small" type="link" onClick={() => openDrawer(rule)}>
                    {t('common.edit')}
                  </Button>
                  <Popconfirm title={t('common.confirmDelete')} onConfirm={() => handleDelete(rule.id)}>
                    <Button danger size="small" type="link">
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              </Flex>
              <Row className="mt-12px" gutter={[16, 12]}>
                <Col md={6} span={12}>
                  <p className="mb-4px text-12px text-gray-400">打卡方式</p>
                  <Flex gap={4} wrap="wrap">
                    {rule.allowMethods.map(method => (
                      <Tag key={method}>{methodLabel(method)}</Tag>
                    ))}
                  </Flex>
                </Col>
                <Col md={6} span={12}>
                  <p className="mb-4px text-12px text-gray-400">拍照/定位要求</p>
                  <p>
                    {rule.requirePhoto ? '需拍照' : '免拍照'} / {rule.requireLocation ? '需定位' : '免定位'}
                  </p>
                </Col>
                <Col md={6} span={12}>
                  <p className="mb-4px text-12px text-gray-400">遠端打卡</p>
                  <p>
                    {!rule.allowRemote && '不允許'}
                    {rule.allowRemote && (rule.remoteApproval ? '允許（需審批）' : '允許（免審批）')}
                  </p>
                </Col>
                <Col md={6} span={12}>
                  <p className="mb-4px text-12px text-gray-400">加班 / 補卡</p>
                  <p>
                    {rule.overtimeAuto ? `自動（≥${rule.overtimeMinMinutes}分）` : '手動'}
                    {' / '}
                    {rule.missedClockAllowAppeal ? `可補卡（${rule.appealDeadlineDays}天）` : '不可補卡'}
                  </p>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer
        footer={
          <Flex justify="space-between">
            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleSave}>
              {t('common.confirm')}
            </Button>
          </Flex>
        }
        open={open}
        title={editingId ? '編輯打卡規則' : '新增打卡規則'}
        width={480}
        onClose={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Form.Item label="規則名稱" name="name" rules={[{ message: t('form.required'), required: true }]}>
            <Input placeholder="例：預設打卡規則" />
          </Form.Item>
          <Form.Item label="打卡方式" name="allowMethods">
            <Checkbox.Group options={translateOptions(clockMethodOptions)} />
          </Form.Item>
          <Flex gap={12}>
            <Form.Item className="flex-1" label="打卡時需拍照" name="requirePhoto" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item className="flex-1" label="打卡時需定位" name="requireLocation" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Flex>
          <Form.Item label="允許遠端打卡" name="allowRemote" valuePropName="checked">
            <Switch />
          </Form.Item>
          {allowRemote && (
            <Form.Item label="遠端打卡需審批" name="remoteApproval" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <Form.Item label="自動計算加班" name="overtimeAuto" valuePropName="checked">
            <Switch />
          </Form.Item>
          {overtimeAuto && (
            <Form.Item label="最低加班時長（分鐘）" name="overtimeMinMinutes">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          )}
          <Form.Item label="允許補卡申請" name="missedClockAllowAppeal" valuePropName="checked">
            <Switch />
          </Form.Item>
          {missedClockAllowAppeal && (
            <Form.Item label="補卡申請期限（天）" name="appealDeadlineDays">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          )}
          <Form.Item label="啟用此規則" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default ClockRulesTab;
