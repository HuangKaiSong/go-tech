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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, Collapse, Table, Tag } from 'antd';
import { useLeaveListQuery } from '@/service/api';
import LeaveOperateDrawer from './modules/LeaveOperateDrawer';
import LeaveSearch from './modules/LeaveSearch';
import {
  leaveStatusRecord,
  leaveStatusTagColorRecord,
  leaveTypeRecord,
  leaveTypeTagColorRecord
} from './modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/leave')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:calendar-range',
      hide: true
    },
    title: '请假管理'
  }
});

type LeaveRecord = TableDataWithIndex<Api.Attendance.LeaveRecord>;

const LEAVE_TABLE_SCROLL_X = 1300;

function RouteComponent() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const navigate = useNavigate();
  const { scrollConfig, tableWrapperRef } = useTableScroll(LEAVE_TABLE_SCROLL_X);

  const { columnChecks, data, getData, searchProps, setColumnChecks, tableProps } = useTable<
    Api.Attendance.LeaveSearchParams,
    Api.Attendance.LeaveRecordList,
    Api.Attendance.LeaveRecord
  >({
    apiParams: {
      applicant: null,
      current: 1,
      leaveType: null,
      size: 10,
      status: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useLeaveListQuery
  });

  const { checkedRowKeys, generalPopupOperation, handleAdd, handleEdit, rowSelection } = useTableOperate<LeaveRecord>(
    data,
    getData
  );

  function createColumns(): TableColumn<LeaveRecord>[] {
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
      { align: 'center', dataIndex: 'code', key: 'code', minWidth: 140, title: '申請編號', width: 150 },
      { align: 'center', dataIndex: 'applicant', key: 'applicant', minWidth: 100, title: '申請人' },
      { align: 'center', dataIndex: 'department', key: 'department', minWidth: 100, title: '部門' },
      {
        align: 'center',
        dataIndex: 'leaveType',
        key: 'leaveType',
        minWidth: 100,
        render: (_, record) => (
          <Tag color={leaveTypeTagColorRecord[record.leaveType]}>{t(leaveTypeRecord.type[record.leaveType])}</Tag>
        ),
        title: '請假類型'
      },
      { align: 'center', dataIndex: 'startDate', key: 'startDate', minWidth: 110, title: '開始日期' },
      { align: 'center', dataIndex: 'endDate', key: 'endDate', minWidth: 110, title: '結束日期' },
      {
        align: 'center',
        dataIndex: 'days',
        key: 'days',
        minWidth: 80,
        render: (_, record) => `${record.days} 天`,
        title: '天數',
        width: 90
      },
      { align: 'center', dataIndex: 'currentNode', key: 'currentNode', minWidth: 120, title: '當前節點' },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 100,
        render: (_, record) => (
          <Tag color={leaveStatusTagColorRecord[record.status]}>{t(leaveStatusRecord.status[record.status])}</Tag>
        ),
        title: '狀態',
        width: 100
      },
      {
        align: 'center',
        fixed: 'right',
        key: 'operate',
        render: (_, record) => (
          <div className="flex-center gap-8px">
            <Button
              size="small"
              type="link"
              onClick={() => navigate({ params: { leaveId: record.code }, to: '/attendance/leave/$leaveId' })}
            >
              {t('common.check')}
            </Button>
            <Button ghost size="small" type="primary" onClick={() => handleEdit(record)}>
              {t('common.edit')}
            </Button>
          </div>
        ),
        title: t('common.operate'),
        width: 140
      }
    ];
  }

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
      <Collapse
        bordered={false}
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        items={[
          {
            children: <LeaveSearch {...searchProps} />,
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
                {t('common.add')}
              </Button>
            </TableHeaderOperation>
          }
          title="請假管理"
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
          <Suspense fallback={null}>
            <LeaveOperateDrawer {...generalPopupOperation} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
