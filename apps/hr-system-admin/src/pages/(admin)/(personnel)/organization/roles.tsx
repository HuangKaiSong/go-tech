import { useAdminState } from '@go-tech/web-admin-layouts';
import {
  type TableColumn,
  type TableDataWithIndex,
  TableHeaderOperation,
  useTable,
  useTableOperate,
  useTableScroll
} from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Card, Col, Collapse, Form, Input, Row, Select, Space, Statistic, Table, Tag } from 'antd';
import { useJobRoleListQuery } from '@/service/api';

export const Route = createFileRoute('/(admin)/(personnel)/organization/roles')({
  component: RouteComponent,
  staticData: {
    title: '职位管理',
    menu: {
      icon: 'lucide:user-round-cog'
    }
  }
});

type RoleRecord = TableDataWithIndex<Api.Organization.Role>;

const ROLE_TABLE_SCROLL_X = 900;

const ROLE_LEVELS: Api.Organization.RoleLevel[] = ['M3', 'M2', 'M1', 'P3', 'P2', 'P1', 'P0'];

const levelTagColorRecord: Record<Api.Organization.RoleLevel, string> = {
  M1: 'gold',
  M2: 'gold',
  M3: 'volcano',
  P0: 'default',
  P1: 'blue',
  P2: 'geekblue',
  P3: 'geekblue'
};

const statusTagColorRecord: Record<Api.Common.EnableStatus, string> = {
  '1': 'success',
  '2': 'default'
};

const statusLabelRecord: Record<Api.Common.EnableStatus, string> = {
  '1': '啟用',
  '2': '停用'
};

function RouteComponent() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const { scrollConfig, tableWrapperRef } = useTableScroll(ROLE_TABLE_SCROLL_X);

  const { columnChecks, data, form, getData, reset, run, setColumnChecks, tableProps, total } = useTable<
    Api.Organization.RoleSearchParams,
    Api.Organization.RoleList,
    Api.Organization.Role
  >({
    apiParams: {
      current: 1,
      department: null,
      level: null,
      size: 10,
      status: null,
      title: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useJobRoleListQuery
  });

  const { checkedRowKeys, handleAdd, handleEdit, rowSelection } = useTableOperate<RoleRecord>(data, getData);

  const departmentOptions = [...new Set(data.map(item => item.department))].map(value => ({ label: value, value }));
  const activeCount = data.filter(item => item.status === '1').length;
  const totalHeadcount = data.reduce((sum, item) => sum + item.headcount, 0);

  function createColumns(): TableColumn<RoleRecord>[] {
    return [
      {
        align: 'center',
        dataIndex: 'index',
        fixed: 'left',
        key: 'index',
        minWidth: 64,
        title: t('common.index'),
        width: 64
      },
      {
        align: 'center',
        dataIndex: 'title',
        key: 'title',
        minWidth: 140,
        title: '職位名稱'
      },
      {
        align: 'center',
        dataIndex: 'level',
        key: 'level',
        minWidth: 90,
        render: (_, record) => <Tag color={levelTagColorRecord[record.level]}>{record.level}</Tag>,
        title: '職等',
        width: 90
      },
      {
        align: 'center',
        dataIndex: 'department',
        key: 'department',
        minWidth: 120,
        title: '所屬部門'
      },
      {
        align: 'center',
        dataIndex: 'headcount',
        key: 'headcount',
        minWidth: 100,
        title: '在職人數',
        width: 100
      },
      {
        align: 'center',
        dataIndex: 'salaryRange',
        key: 'salaryRange',
        minWidth: 120,
        title: '薪資範圍',
        width: 120
      },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 90,
        render: (_, record) => (
          <Tag color={statusTagColorRecord[record.status]}>{statusLabelRecord[record.status]}</Tag>
        ),
        title: '狀態',
        width: 90
      },
      {
        align: 'center',
        fixed: 'right',
        key: 'operate',
        render: (_, record) => (
          <Button size="small" type="link" onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
        ),
        title: t('common.operate'),
        width: 100
      }
    ];
  }

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
      <Row gutter={[16, 16]}>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="職位總數" value={total} />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="啟用中" value={activeCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="在職人數" value={totalHeadcount} />
          </Card>
        </Col>
        <Col lg={6} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="部門覆蓋" value={departmentOptions.length} />
          </Card>
        </Col>
      </Row>

      <Collapse
        bordered={false}
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        items={[
          {
            children: (
              <Form form={form} labelCol={{ md: 6, span: 24 }}>
                <Row gutter={[16, 16]} wrap>
                  <Col lg={6} md={12} span={24}>
                    <Form.Item className="m-0" label="職位名稱" name="title">
                      <Input allowClear placeholder="搜尋職位名稱、部門" />
                    </Form.Item>
                  </Col>
                  <Col lg={6} md={12} span={24}>
                    <Form.Item className="m-0" label="所屬部門" name="department">
                      <Select allowClear options={departmentOptions} placeholder="全部部門" />
                    </Form.Item>
                  </Col>
                  <Col lg={6} md={12} span={24}>
                    <Form.Item className="m-0" label="職等" name="level">
                      <Select
                        allowClear
                        options={ROLE_LEVELS.map(value => ({ label: value, value }))}
                        placeholder="全部職等"
                      />
                    </Form.Item>
                  </Col>
                  <Col lg={6} md={12} span={24}>
                    <Form.Item className="m-0" label="狀態" name="status">
                      <Select
                        allowClear
                        options={[
                          { label: '啟用', value: '1' },
                          { label: '停用', value: '2' }
                        ]}
                        placeholder="全部狀態"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Space className="w-full justify-end">
                      <Button onClick={reset}>{t('common.reset')}</Button>
                      <Button type="primary" onClick={() => run()}>
                        {t('common.search')}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            ),
            key: '1',
            label: t('common.search')
          }
        ]}
      />

      <div className="min-h-0 flex flex-1 flex-col" ref={tableWrapperRef}>
        <Card
          className="min-h-0 flex flex-1 flex-col card-wrapper"
          extra={
            <TableHeaderOperation
              add={handleAdd}
              columns={columnChecks}
              disabledDelete={checkedRowKeys.length === 0}
              loading={tableProps.loading}
              refresh={getData}
              setColumnChecks={setColumnChecks}
            />
          }
          title="職位管理"
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
        </Card>
      </div>
    </div>
  );
}
