import type { GeneralPopupOperationProps, TableDataWithIndex } from '@go-tech/web-ui-compose';
import { Button, Drawer, Flex, Form, Input } from 'antd';
import type { FormRule } from 'antd';
import { useTranslation } from 'react-i18next';

type DepartmentTableRecord = TableDataWithIndex<Api.Organization.Department>;

interface DepartmentOperateDrawerProps {
  /** Ant Design form instance shared with table operate hook. */
  form: GeneralPopupOperationProps<DepartmentTableRecord>['form'];
  /** Submit add or edit form. */
  handleSubmit: GeneralPopupOperationProps<DepartmentTableRecord>['handleSubmit'];
  /** Close drawer and reset form state. */
  onClose: GeneralPopupOperationProps<DepartmentTableRecord>['onClose'];
  /** Whether the drawer is visible. */
  open: GeneralPopupOperationProps<DepartmentTableRecord>['open'];
  /** Current operation type. */
  operateType: GeneralPopupOperationProps<DepartmentTableRecord>['operateType'];
}

const DepartmentOperateDrawer = (props: DepartmentOperateDrawerProps) => {
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
      title={operateType === 'add' ? t('page.manage.user.addUser') : t('page.manage.user.editUser')}
      onClose={onClose}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="部門名稱" name="name" rules={[requiredRule]}>
          <Input placeholder="請輸入部門名稱" />
        </Form.Item>

        <Form.Item label="部門代碼" name="code" rules={[requiredRule]}>
          <Input placeholder="請輸入部門代碼" />
        </Form.Item>

        <Form.Item label="部門主管" name="managerName">
          <Input placeholder="請輸入部門主管" />
        </Form.Item>
        <Form.Item label="部門職責說明" name="description">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default DepartmentOperateDrawer;

function createRequiredRule(message: string): FormRule {
  return {
    message,
    required: true
  };
}
