import { SvgIcon } from '@go-tech/web-ui-compose';
import type { TableSearchProps } from '@go-tech/web-ui-compose';
import { Button, Col, Flex, Form, Input, Row, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '@/utils/common';

import { departmentEnableStatusOptions } from './shared';

interface DepartmentSearchProps {
  /** Ant Design search form instance controlled by the table hook. */
  form: TableSearchProps<Api.Organization.DepartmentSearchParams>['form'];
  /** Reset search form and submitted query params. */
  reset: TableSearchProps<Api.Organization.DepartmentSearchParams>['reset'];
  /** Submit search form. */
  search: TableSearchProps<Api.Organization.DepartmentSearchParams>['search'];
  /** Current submitted search params used as form initial values. */
  searchParams: TableSearchProps<Api.Organization.DepartmentSearchParams>['searchParams'];
}

const DepartmentSearch = (props: DepartmentSearchProps) => {
  const { form, reset, search, searchParams } = props;

  const { t } = useTranslation();

  async function handleSearch() {
    await search();
  }

  return (
    <Form form={form} initialValues={searchParams} labelCol={{ md: 7, span: 5 }}>
      <Row gutter={[16, 16]} wrap>
        <Col lg={6} md={12} span={24}>
          <Form.Item className="m-0" label="部門名稱" name="name">
            <Input allowClear placeholder="搜尋部門名稱" />
          </Form.Item>
        </Col>

        <Col lg={6} md={12} span={24}>
          <Form.Item className="m-0" label="部門代碼" name="code">
            <Input allowClear placeholder="搜尋部門代碼" />
          </Form.Item>
        </Col>

        <Col lg={6} md={12} span={24}>
          <Form.Item className="m-0" label="部門主管" name="managerName">
            <Input allowClear placeholder="搜尋主管" />
          </Form.Item>
        </Col>

        <Col lg={6} md={12} span={24}>
          <Form.Item className="m-0" label="狀態" name="status">
            <Select allowClear options={translateOptions(departmentEnableStatusOptions)} />
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

export default DepartmentSearch;
