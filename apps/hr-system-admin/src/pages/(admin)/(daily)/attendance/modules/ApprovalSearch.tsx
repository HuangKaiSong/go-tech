import { SvgIcon } from '@go-tech/web-ui-compose';
import type { TableSearchProps } from '@go-tech/web-ui-compose';
import { Button, Col, Flex, Form, Input, Row, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '@/utils/common';

import { approvalStatusOptions, approvalTypeOptions } from './shared';

interface ApprovalSearchProps {
  /** Ant Design search form instance controlled by the table hook. */
  form: TableSearchProps<Api.Attendance.ApprovalSearchParams>['form'];
  /** Reset search form and submitted query params. */
  reset: TableSearchProps<Api.Attendance.ApprovalSearchParams>['reset'];
  /** Submit search form. */
  search: TableSearchProps<Api.Attendance.ApprovalSearchParams>['search'];
  /** Current submitted search params used as form initial values. */
  searchParams: TableSearchProps<Api.Attendance.ApprovalSearchParams>['searchParams'];
}

const ApprovalSearch = (props: ApprovalSearchProps) => {
  const { form, reset, search, searchParams } = props;

  const { t } = useTranslation();

  async function handleSearch() {
    await search();
  }

  return (
    <Form form={form} initialValues={searchParams} labelCol={{ md: 7, span: 5 }}>
      <Row gutter={[16, 16]} wrap>
        <Col lg={8} md={12} span={24}>
          <Form.Item className="m-0" label="申請人 / 編號" name="applicant">
            <Input allowClear placeholder="搜尋申請人、編號、摘要" />
          </Form.Item>
        </Col>

        <Col lg={8} md={12} span={24}>
          <Form.Item className="m-0" label="申請類型" name="type">
            <Select allowClear options={translateOptions(approvalTypeOptions)} placeholder="全部類型" />
          </Form.Item>
        </Col>

        <Col lg={8} md={12} span={24}>
          <Form.Item className="m-0" label="狀態" name="status">
            <Select allowClear options={translateOptions(approvalStatusOptions)} placeholder="全部狀態" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item className="m-0">
            <Flex align="center" gap={12} justify="end">
              <Button icon={<SvgIcon icon="ic:round-refresh" />} onClick={reset}>
                {t('common.reset')}
              </Button>
              <Button ghost icon={<SvgIcon icon="ic:round-search" />} type="primary" onClick={handleSearch}>
                {t('common.search')}
              </Button>
            </Flex>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default ApprovalSearch;
