import type { GeneralPopupOperationProps, TableDataWithIndex } from '@go-tech/web-ui-compose';
import { Button, Drawer, Flex, Form, Input, InputNumber, Select } from 'antd';
import type { FormRule } from 'antd';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '@/utils/common';

import { leaveTypeOptions } from './shared';

type LeaveTableRecord = TableDataWithIndex<Api.Attendance.LeaveRecord>;

interface LeaveOperateDrawerProps {
  /** Ant Design form instance shared with table operate hook. */
  form: GeneralPopupOperationProps<LeaveTableRecord>['form'];
  /** Submit add or edit form. */
  handleSubmit: GeneralPopupOperationProps<LeaveTableRecord>['handleSubmit'];
  /** Close drawer and reset form state. */
  onClose: GeneralPopupOperationProps<LeaveTableRecord>['onClose'];
  /** Whether the drawer is visible. */
  open: GeneralPopupOperationProps<LeaveTableRecord>['open'];
  /** Current operation type. */
  operateType: GeneralPopupOperationProps<LeaveTableRecord>['operateType'];
}

const LeaveOperateDrawer = (props: LeaveOperateDrawerProps) => {
  const { form, handleSubmit, onClose, open, operateType } = props;

  const { t } = useTranslation();
  const requiredRule: FormRule = { message: t('form.required'), required: true };

  return (
    <Drawer
      footer={
        <Flex justify="space-between">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit}>
            {t('common.confirm')}
          </Button>
        </Flex>
      }
      open={open}
      title={operateType === 'add' ? '新增請假申請' : '編輯請假申請'}
      onClose={onClose}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="申請人" name="applicant" rules={[requiredRule]}>
          <Input placeholder="請輸入申請人" />
        </Form.Item>
        <Form.Item label="部門" name="department" rules={[requiredRule]}>
          <Input placeholder="請輸入部門" />
        </Form.Item>
        <Form.Item label="請假類型" name="leaveType" rules={[requiredRule]}>
          <Select options={translateOptions(leaveTypeOptions)} placeholder="請選擇請假類型" />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item className="flex-1" label="開始日期" name="startDate" rules={[requiredRule]}>
            <Input placeholder="2026-03-10" />
          </Form.Item>
          <Form.Item className="flex-1" label="結束日期" name="endDate" rules={[requiredRule]}>
            <Input placeholder="2026-03-12" />
          </Form.Item>
        </Flex>
        <Form.Item label="請假天數" name="days">
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item label="請假事由" name="reason">
          <Input.TextArea placeholder="請輸入請假事由" rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default LeaveOperateDrawer;
