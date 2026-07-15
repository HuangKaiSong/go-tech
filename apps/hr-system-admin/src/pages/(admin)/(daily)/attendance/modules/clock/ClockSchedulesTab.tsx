import { SvgIcon } from '@go-tech/web-ui-compose';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Card,
  Checkbox,
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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useClockScheduleListQuery } from '@/service/api';
import { translateOptions } from '@/utils/common';

import {
  WEEK_DAY_LABELS,
  WEEK_DAYS,
  scheduleTypeOptions,
  scheduleTypeRecord,
  scheduleTypeTagColorRecord
} from './shared';

type ClockSchedule = Api.Attendance.ClockSchedule;

const EMPTY_SCHEDULE: ClockSchedule = {
  breakEnd: '13:00',
  breakStart: '12:00',
  earlyLeaveGrace: 5,
  enabled: true,
  id: '',
  lateGrace: 5,
  name: '',
  type: 'fixed',
  workDays: [1, 2, 3, 4, 5],
  workEnd: '18:00',
  workStart: '09:00'
};

const weekDayOptions = WEEK_DAYS.map(day => ({ label: WEEK_DAY_LABELS[day], value: day }));

const ClockSchedulesTab = () => {
  const { t } = useTranslation();
  const { data, isFetching } = useClockScheduleListQuery({ current: 1, size: 100 });

  const [schedules, setSchedules] = useState<ClockSchedule[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<ClockSchedule>();

  useEffect(() => {
    if (data?.records) setSchedules(data.records);
  }, [data]);

  function openDrawer(record?: ClockSchedule) {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.setFieldsValue({ ...EMPTY_SCHEDULE, id: `S${Date.now()}` });
    }
    setOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSchedules(prev =>
      editingId ? prev.map(item => (item.id === editingId ? { ...item, ...values } : item)) : [...prev, values]
    );
    message.success(editingId ? t('common.updateSuccess') : t('common.addSuccess'));
    setOpen(false);
  }

  function handleDelete(id: string) {
    setSchedules(prev => prev.filter(item => item.id !== id));
    message.success(t('common.deleteSuccess'));
  }

  const columns: TableColumnsType<ClockSchedule> = [
    { align: 'center', dataIndex: 'name', key: 'name', minWidth: 120, title: '班次名稱' },
    {
      align: 'center',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => (
        <Tag color={scheduleTypeTagColorRecord[record.type]}>{t(scheduleTypeRecord.type[record.type])}</Tag>
      ),
      title: '類型',
      width: 100
    },
    { align: 'center', dataIndex: 'workStart', key: 'workStart', title: '上班', width: 90 },
    { align: 'center', dataIndex: 'workEnd', key: 'workEnd', title: '下班', width: 90 },
    {
      align: 'center',
      key: 'break',
      render: (_, record) => `${record.breakStart}–${record.breakEnd}`,
      title: '午休',
      width: 130
    },
    {
      align: 'center',
      dataIndex: 'lateGrace',
      key: 'lateGrace',
      render: (_, record) => `${record.lateGrace} min`,
      title: '遲到寬限',
      width: 100
    },
    {
      align: 'center',
      key: 'workDays',
      render: (_, record) => (
        <Flex gap={2} justify="center">
          {WEEK_DAYS.map(day => (
            <span
              className={`h-20px w-20px flex-center rounded text-12px ${record.workDays.includes(day) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
              key={day}
            >
              {WEEK_DAY_LABELS[day]}
            </span>
          ))}
        </Flex>
      ),
      title: '工作日',
      width: 180
    },
    {
      align: 'center',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (_, record) => (
        <Tag color={record.enabled ? 'success' : 'default'}>{record.enabled ? '啟用' : '停用'}</Tag>
      ),
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
        <Button
          icon={<SvgIcon className="text-icon" icon="ic:round-plus" />}
          type="primary"
          onClick={() => openDrawer()}
        >
          新增班次
        </Button>
      }
      title="班次時間列表"
      variant="borderless"
    >
      <Table
        columns={columns}
        dataSource={schedules}
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
        title={editingId ? '編輯班次' : '新增班次'}
        width={480}
        onClose={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Form.Item label="班次名稱" name="name" rules={[{ message: t('form.required'), required: true }]}>
            <Input placeholder="例：標準班" />
          </Form.Item>
          <Form.Item label="班次類型" name="type">
            <Select options={translateOptions(scheduleTypeOptions)} />
          </Form.Item>
          <Flex gap={12}>
            <Form.Item className="flex-1" label="上班時間" name="workStart">
              <Input placeholder="09:00" />
            </Form.Item>
            <Form.Item className="flex-1" label="下班時間" name="workEnd">
              <Input placeholder="18:00" />
            </Form.Item>
          </Flex>
          <Flex gap={12}>
            <Form.Item className="flex-1" label="午休開始" name="breakStart">
              <Input placeholder="12:00" />
            </Form.Item>
            <Form.Item className="flex-1" label="午休結束" name="breakEnd">
              <Input placeholder="13:00" />
            </Form.Item>
          </Flex>
          <Flex gap={12}>
            <Form.Item className="flex-1" label="遲到寬限（分鐘）" name="lateGrace">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item className="flex-1" label="早退寬限（分鐘）" name="earlyLeaveGrace">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </Flex>
          <Form.Item label="工作日" name="workDays">
            <Checkbox.Group options={weekDayOptions} />
          </Form.Item>
          <Form.Item label="啟用此班次" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default ClockSchedulesTab;
