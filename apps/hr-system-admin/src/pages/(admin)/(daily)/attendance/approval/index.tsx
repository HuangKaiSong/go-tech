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
import { Badge, Button, Card, Collapse, Table, Tabs, Tag } from 'antd';
import { useApprovalListQuery, usePendingApprovalListQuery } from '@/service/api';
import ApprovalRulesTab from '../modules/ApprovalRulesTab';
import ApprovalSearch from '../modules/ApprovalSearch';
import PendingApprovalTab from '../modules/PendingApprovalTab';
import {
  approvalStatusRecord,
  approvalStatusTagColorRecord,
  approvalTypeRecord,
  approvalTypeTagColorRecord,
  normalizeApprovalSearchSchema
} from '../modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/approval/')({
  component: RouteComponent,
  staticData: {
    title: '审批管理'
  }
});

const ApprovalOperateDrawer = lazy(() => import('../modules/ApprovalOperateDrawer'));

type ApprovalRecord = TableDataWithIndex<Api.Attendance.ApprovalRecord>;

const APPROVAL_TABLE_SCROLL_X = 1200;

function AllApprovalTab() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const navigate = useNavigate();
  const { scrollConfig, tableWrapperRef } = useTableScroll(APPROVAL_TABLE_SCROLL_X);

  const { columnChecks, data, getData, searchProps, setColumnChecks, tableProps } = useTable<
    Api.Attendance.ApprovalSearchParams,
    Api.Attendance.ApprovalRecordList,
    Api.Attendance.ApprovalRecord
  >({
    apiParams: {
      applicant: null,
      current: 1,
      size: 10,
      status: null,
      type: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useApprovalListQuery,
    transformParams: normalizeApprovalSearchSchema
  });

  const { checkedRowKeys, generalPopupOperation, handleAdd, handleEdit, rowSelection } = useTableOperate<ApprovalRecord>(
    data,
    getData
  );

  function createColumns(): TableColumn<ApprovalRecord>[] {
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
        dataIndex: 'type',
        key: 'type',
        minWidth: 110,
        render: (_, record) => (
          <Tag color={approvalTypeTagColorRecord[record.type]}>{t(approvalTypeRecord.type[record.type])}</Tag>
        ),
        title: '申請類型'
      },
      { align: 'center', dataIndex: 'summary', ellipsis: true, key: 'summary', minWidth: 180, title: '摘要' },
      { align: 'center', dataIndex: 'submitTime', key: 'submitTime', minWidth: 150, title: '提交時間', width: 160 },
      { align: 'center', dataIndex: 'currentNode', key: 'currentNode', minWidth: 130, title: '當前節點' },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 90,
        render: (_, record) => (
          <Tag color={approvalStatusTagColorRecord[record.status]}>{t(approvalStatusRecord.status[record.status])}</Tag>
        ),
        title: '狀態',
        width: 90
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
              onClick={() => navigate({ params: { approvalId: record.code }, to: '/attendance/approval/$approvalId' })}
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
    <div className="flex flex-col gap-16px">
      <Collapse
        bordered={false}
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        items={[
          {
            children: <ApprovalSearch {...searchProps} />,
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
          title="審批記錄"
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
          <Suspense fallback={null}>
            <ApprovalOperateDrawer {...generalPopupOperation} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { data: pendingData } = usePendingApprovalListQuery({ current: 1, size: 100 });
  const pendingCount = pendingData?.total ?? 0;

  return (
    <div className="h-full min-h-500px overflow-auto">
      <Tabs
        defaultActiveKey="all"
        items={[
          {
            children: <AllApprovalTab />,
            key: 'all',
            label: '全部記錄'
          },
          {
            children: <PendingApprovalTab />,
            key: 'pending',
            label: (
              <span>
                待我審批
                <Badge className="ml-6px" count={pendingCount} showZero size="small" />
              </span>
            )
          },
          {
            children: <ApprovalRulesTab />,
            key: 'rules',
            label: '審批規則'
          }
        ]}
      />
    </div>
  );
}
