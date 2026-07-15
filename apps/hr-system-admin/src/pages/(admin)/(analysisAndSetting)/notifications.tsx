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
import { Card, Collapse, Table, Tag } from 'antd';
import { useUserListQuery } from '@/service/api';
import {
  enableStatusTagColorRecord,
  normalizeUserSearchParams,
  userGenderTagColorRecord,
  userStatusRecord
} from './modules/shared';

export const Route = createFileRoute('/(admin)/(analysisAndSetting)/notifications')({
  component: RouteComponent,
  staticData: {
    title: '消息通知',
    menu: {
      order: 1,
      icon: 'lucide:bell'
    }
  }
});

type UserTableRecord = TableDataWithIndex<Api.SystemManage.User>;

const USER_TABLE_SCROLL_X = 1132;

function RouteComponent() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const { scrollConfig, tableWrapperRef } = useTableScroll(USER_TABLE_SCROLL_X);

  const { columnChecks, data, getData, setColumnChecks, tableProps } = useTable({
    columns: createColumns,
    isMobile,
    pagination: {
      showQuickJumper: true
    },
    transformParams: normalizeUserSearchParams,
    queryHook: useUserListQuery
  });

  const { checkedRowKeys, handleAdd, rowSelection } = useTableOperate<UserTableRecord>(data, getData);

  function createColumns(): TableColumn<UserTableRecord>[] {
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
        minWidth: 120,
        title: t('page.notifications.title')
      },
      {
        align: 'center',
        dataIndex: 'type',
        key: 'type',
        minWidth: 100,
        render: (_, record) => {
          if (!record.userGender) return null;

          return (
            <Tag color={userGenderTagColorRecord[record.userGender]}>
              {t(userStatusRecord.gender[record.userGender])}
            </Tag>
          );
        },
        title: t('page.notifications.type'),
        width: 100
      },
      {
        align: 'center',
        dataIndex: 'nickName',
        key: 'nickName',
        minWidth: 120,
        title: t('page.manage.user.nickName')
      },
      {
        align: 'center',
        dataIndex: 'userPhone',
        key: 'userPhone',
        minWidth: 140,
        title: t('page.manage.user.userPhone'),
        width: 140
      },
      {
        align: 'center',
        dataIndex: 'userEmail',
        key: 'userEmail',
        minWidth: 220,
        title: t('page.manage.user.userEmail')
      },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 100,
        render: (_, record) => {
          if (!record.status) return null;

          return (
            <Tag color={enableStatusTagColorRecord[record.status]}>{t(userStatusRecord.status[record.status])}</Tag>
          );
        },
        title: t('page.manage.user.userStatus'),
        width: 100
      },
      {
        align: 'center',
        fixed: 'right',
        key: 'operate',
        minWidth: 220,
        render: (_, __) => <div className="flex-center gap-8px" />,
        title: t('common.operate'),
        width: 220
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
          // {
          //   children: <UserSearch {...searchProps} />,
          //   key: '1',
          //   label: t('common.search')
          // }
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
          title={t('route.notifications')}
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
          <Suspense fallback={null}>{/* <UserOperateDrawer {...generalPopupOperation} /> */}</Suspense>
        </Card>
      </div>
    </div>
  );
}
