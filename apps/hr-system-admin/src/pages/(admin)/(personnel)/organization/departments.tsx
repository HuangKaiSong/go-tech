import { useAdminState } from '@go-tech/web-admin-layouts';
import {
  SvgIcon,
  type TableColumn,
  type TableDataWithIndex,
  TableHeaderOperation,
  useTable,
  useTableOperate,
  useTableScroll
} from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Card, Col, Collapse, Row, Statistic, Table, Tag } from 'antd';
import { utils, writeFile } from 'xlsx';
import { useDepartmentListQuery } from '@/service/api';
import DepartmentSearch from './modules/DepartmentSearch';
import { departmentEnableStatusTagColorRecord, departmentStatusRecord } from './modules/shared';

export const Route = createFileRoute('/(admin)/(personnel)/organization/departments')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:container'
    },
    title: '部门管理'
  }
});

const DepartmentOperateDrawer = lazy(() => import('./modules/DepartmentOperateDrawer'));

type DepartmentRecord = TableDataWithIndex<Api.Organization.Department>;

const DEPARTMENT_TABLE_SCROLL_X = 1000;

function RouteComponent() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const { scrollConfig, tableWrapperRef } = useTableScroll(DEPARTMENT_TABLE_SCROLL_X);

  const { columnChecks, data, getData, searchProps, setColumnChecks, tableProps, total } = useTable<
    Api.Organization.DepartmentSearchParams,
    Api.Organization.DepartmentList,
    Api.Organization.Department
  >({
    apiParams: {
      code: null,
      current: 1,
      managerName: null,
      name: null,
      size: 10,
      status: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useDepartmentListQuery
  });

  const { checkedRowKeys, generalPopupOperation, handleAdd, handleEdit, rowSelection } =
    useTableOperate<DepartmentRecord>(data, getData);

  const activeCount = data.filter(item => item.status === '1').length;
  const totalMembers = data.reduce((sum, item) => sum + (item.memberCount ?? 0), 0);

  const handleExport = () => {
    const exportData = data.map((item, index) => ({
      [t('common.index')]: index + 1,
      部門代碼: item.code,
      部門名稱: item.name,
      部門主管: item.managerName,
      人數: item.memberCount,
      說明: item.description,
      建立日期: item.createdAt,
      狀態: t(departmentStatusRecord.status[item.status])
    }));
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 }
    ];
    utils.book_append_sheet(workbook, worksheet, '部门列表');
    writeFile(workbook, 'hr-departments.xlsx');
  };

  function createColumns(): TableColumn<DepartmentRecord>[] {
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
        dataIndex: 'code',
        key: 'code',
        minWidth: 100,
        title: '部門代碼',
        width: 120
      },
      {
        align: 'center',
        dataIndex: 'name',
        key: 'name',
        minWidth: 120,
        title: '部門名稱'
      },
      {
        align: 'center',
        dataIndex: 'managerName',
        key: 'managerName',
        minWidth: 120,
        render: (_, record) => record.managerName ?? '-',
        title: '部門主管'
      },
      {
        align: 'center',
        dataIndex: 'memberCount',
        key: 'memberCount',
        minWidth: 90,
        render: (_, record) => record.memberCount ?? 0,
        title: '人數',
        width: 90
      },
      {
        align: 'center',
        dataIndex: 'description',
        ellipsis: true,
        key: 'description',
        minWidth: 200,
        render: (_, record) => record.description ?? '-',
        title: '說明'
      },
      {
        align: 'center',
        dataIndex: 'createdAt',
        key: 'createdAt',
        minWidth: 120,
        title: '建立日期',
        width: 120
      },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 90,
        render: (_, record) => (
          <Tag color={departmentEnableStatusTagColorRecord[record.status]}>
            {t(departmentStatusRecord.status[record.status])}
          </Tag>
        ),
        title: '狀態',
        width: 90
      },
      {
        align: 'center',
        fixed: 'right',
        key: 'operate',
        render: (_, record) => (
          <Button ghost size="small" type="primary" onClick={() => handleEdit(record)}>
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
        <Col lg={8} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="部門總數" value={total} prefix={<SvgIcon icon="lucide:building-2" />} />
          </Card>
        </Col>
        <Col lg={8} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              title="啟用中"
              value={activeCount}
              prefix={<SvgIcon icon="lucide:trending-up" />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col lg={8} span={12}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic title="總人數" prefix={<SvgIcon icon="lucide:users" />} value={totalMembers} />
          </Card>
        </Col>
      </Row>

      <Collapse
        bordered={false}
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        items={[
          {
            children: <DepartmentSearch {...searchProps} />,
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
              columns={columnChecks}
              disabledDelete={checkedRowKeys.length === 0}
              loading={tableProps.loading}
              refresh={getData}
              setColumnChecks={setColumnChecks}
            >
              <Button icon={<SvgIcon className="text-icon" icon="ic:round-plus" />} type="primary" onClick={handleAdd}>
                {t('common.add')}部门
              </Button>
              <Button
                ghost
                icon={<SvgIcon className="text-icon" icon="lucide:download" />}
                type="primary"
                onClick={handleExport}
              >
                导出
              </Button>
            </TableHeaderOperation>
          }
          title="部門管理"
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
          <Suspense fallback={null}>
            <DepartmentOperateDrawer {...generalPopupOperation} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
