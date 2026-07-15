import { SvgIcon } from '@go-tech/web-ui-compose';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useClockLocationListQuery, useClockRuleListQuery } from '@/service/api';

type ClockLocation = Api.Attendance.ClockLocation;

const EMPTY_LOCATION: ClockLocation = {
  address: '',
  enabled: true,
  id: '',
  lat: '',
  lng: '',
  name: '',
  radius: 200,
  ruleId: '',
  wifiSSID: ''
};

const ClockLocationsTab = () => {
  const { t } = useTranslation();
  const { data, isFetching } = useClockLocationListQuery({ current: 1, size: 100 });
  const { data: ruleData } = useClockRuleListQuery({ current: 1, size: 100 });

  const [locations, setLocations] = useState<ClockLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<ClockLocation>();

  useEffect(() => {
    if (data?.records) setLocations(data.records);
  }, [data]);

  const rules = ruleData?.records ?? [];
  const ruleOptions = useMemo(() => rules.map(rule => ({ label: rule.name, value: rule.id })), [rules]);
  const ruleNameMap = useMemo(() => new Map(rules.map(rule => [rule.id, rule.name])), [rules]);

  function openDrawer(record?: ClockLocation) {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.setFieldsValue({ ...EMPTY_LOCATION, id: `L${Date.now()}` });
    }
    setOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setLocations(prev =>
      editingId ? prev.map(item => (item.id === editingId ? { ...item, ...values } : item)) : [...prev, values]
    );
    message.success(editingId ? t('common.updateSuccess') : t('common.addSuccess'));
    setOpen(false);
  }

  function handleDelete(id: string) {
    setLocations(prev => prev.filter(item => item.id !== id));
    message.success(t('common.deleteSuccess'));
  }

  const columns: TableColumnsType<ClockLocation> = [
    { align: 'center', dataIndex: 'name', key: 'name', minWidth: 120, title: '地點名稱' },
    { align: 'center', dataIndex: 'address', ellipsis: true, key: 'address', minWidth: 200, title: '地址' },
    {
      align: 'center',
      key: 'coords',
      render: (_, record) => `${record.lat}, ${record.lng}`,
      title: '座標',
      width: 160
    },
    {
      align: 'center',
      dataIndex: 'radius',
      key: 'radius',
      render: (_, record) => `${record.radius} m`,
      title: '有效範圍',
      width: 100
    },
    {
      align: 'center',
      dataIndex: 'wifiSSID',
      key: 'wifiSSID',
      render: (_, record) =>
        record.wifiSSID ? (
          <Tag icon={<SvgIcon className="inline-block" icon="lucide:wifi" />}>{record.wifiSSID}</Tag>
        ) : (
          '—'
        ),
      title: 'Wi-Fi SSID',
      width: 140
    },
    {
      align: 'center',
      key: 'rule',
      render: (_, record) => ruleNameMap.get(record.ruleId) ?? '—',
      title: '關聯規則',
      width: 140
    },
    {
      align: 'center',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (_, record) => <Tag color={record.enabled ? 'success' : 'default'}>{record.enabled ? '啟用' : '停用'}</Tag>,
      title: '狀態',
      width: 90
    },
    {
      align: 'center',
      key: 'operate',
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" onClick={() => openDrawer(record)}>
            {t('common.edit')}
          </Button>
          <Popconfirm title={t('common.confirmDelete')} onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" type="link">
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: t('common.operate'),
      width: 140
    }
  ];

  return (
    <Card
      className="card-wrapper"
      extra={
        <Button icon={<SvgIcon className="text-icon" icon="ic:round-plus" />} type="primary" onClick={() => openDrawer()}>
          新增地點
        </Button>
      }
      title="打卡地點列表"
      variant="borderless"
    >
      <Table
        columns={columns}
        dataSource={locations}
        loading={isFetching}
        pagination={false}
        rowKey="id"
        scroll={{ x: 1090 }}
        size="small"
      />

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
        title={editingId ? '編輯打卡地點' : '新增打卡地點'}
        width={480}
        onClose={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Form.Item label="地點名稱" name="name" rules={[{ message: t('form.required'), required: true }]}>
            <Input placeholder="例：總部大樓" />
          </Form.Item>
          <Form.Item label="地址" name="address" rules={[{ message: t('form.required'), required: true }]}>
            <Input placeholder="詳細地址" />
          </Form.Item>
          <Flex gap={12}>
            <Form.Item className="flex-1" label="緯度" name="lat">
              <Input placeholder="25.0330" />
            </Form.Item>
            <Form.Item className="flex-1" label="經度" name="lng">
              <Input placeholder="121.5654" />
            </Form.Item>
          </Flex>
          <Form.Item label="有效範圍（公尺）" name="radius">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item label="Wi-Fi SSID（選填）" name="wifiSSID">
            <Input placeholder="辦公室 Wi-Fi 名稱" />
          </Form.Item>
          <Form.Item label="關聯打卡規則" name="ruleId">
            <Select allowClear options={ruleOptions} placeholder="選擇打卡規則（選填）" />
          </Form.Item>
          <Form.Item label="啟用此地點" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default ClockLocationsTab;
