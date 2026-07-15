import type { GeneralPopupOperationProps, TableDataWithIndex } from '@go-tech/web-ui-compose';
import { Button, Drawer, Flex, Form, Input, Select } from 'antd';
import type { FormRule } from 'antd';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '@/utils/common';

import { approvalTypeOptions } from './shared';

type ApprovalTableRecord = TableDataWithIndex<Api.Attendance.ApprovalRecord>;

interface ApprovalOperateDrawerProps {
  /** Ant Design form instance shared with table operate hook. */
  form: GeneralPopupOperationProps<ApprovalTableRecord>['form'];
  /** Submit add or edit form. */
  handleSubmit: GeneralPopupOperationProps<ApprovalTableRecord>['handleSubmit'];
  /** Close drawer and reset form state. */
  onClose: GeneralPopupOperationProps<ApprovalTableRecord>['onClose'];
  /** Whether the drawer is visible. */
  open: GeneralPopupOperationProps<ApprovalTableRecord>['open'];
  /** Current operation type. */
  operateType: GeneralPopupOperationProps<ApprovalTableRecord>['operateType'];
}

const ApprovalOperateDrawer = (props: ApprovalOperateDrawerProps) => {
  const { form, handleSubmit, onClose, open, operateType } = props;

  const { t } = useTranslation();
  const requiredRule = createRequiredRule(t('form.required'));

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
      title={operateType === 'add' ? '新增審批申請' : '編輯審批申請'}
      onClose={onClose}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="申請人" name="applicant" rules={[requiredRule]}>
          <Input placeholder="請輸入申請人" />
        </Form.Item>

        <Form.Item label="部門" name="department" rules={[requiredRule]}>
          <Input placeholder="請輸入部門" />
        </Form.Item>

        <Form.Item label="申請類型" name="type" rules={[requiredRule]}>
          <Select options={translateOptions(approvalTypeOptions)} placeholder="請選擇申請類型" />
        </Form.Item>

        <Form.Item label="申請子類型" name="subType">
          <Input placeholder="例如：年假 / 差旅費" />
        </Form.Item>

        <Form.Item label="摘要" name="summary" rules={[requiredRule]}>
          <Input.TextArea placeholder="請輸入申請摘要" rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ApprovalOperateDrawer;

function createRequiredRule(message: string): FormRule {
  return {
    message,
    required: true
  };
}
