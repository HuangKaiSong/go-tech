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
import { Button, Card, Col, Collapse, Form, Input, Row, Select, Space, Table, Tag } from 'antd';
import { useOvertimeListQuery } from '@/service/api';
import { translateOptions } from '@/utils/common';
import { overtimeStatusOptions, overtimeStatusRecord, overtimeStatusTagColorRecord } from './modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/overtime')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:timer',
      hide: true
    },
    title: '加班管理'
  }
});

type OvertimeRecord = TableDataWithIndex<Api.Attendance.OvertimeRecord>;

const OVERTIME_TABLE_SCROLL_X = 900;

function RouteComponent() {
  const { t } = useTranslation();
  const { isMobile } = useAdminState();
  const { scrollConfig, tableWrapperRef } = useTableScroll(OVERTIME_TABLE_SCROLL_X);

  const { columnChecks, data, form, getData, reset, run, setColumnChecks, tableProps } = useTable<
    Api.Attendance.OvertimeSearchParams,
    Api.Attendance.OvertimeRecordList,
    Api.Attendance.OvertimeRecord
  >({
    apiParams: {
      current: 1,
      department: null,
      name: null,
      size: 10,
      status: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useOvertimeListQuery
  });

  const { checkedRowKeys, handleAdd, rowSelection } = useTableOperate<OvertimeRecord>(data, getData);

  const departmentOptions = [...new Set(data.map(item => item.department))].map(value => ({ label: value, value }));

  function createColumns(): TableColumn<OvertimeRecord>[] {
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
      { align: 'center', dataIndex: 'name', key: 'name', minWidth: 120, title: '申請人' },
      { align: 'center', dataIndex: 'department', key: 'department', minWidth: 120, title: '部門' },
      { align: 'center', dataIndex: 'date', key: 'date', minWidth: 120, title: '加班日期', width: 130 },
      {
        align: 'center',
        dataIndex: 'hours',
        key: 'hours',
        minWidth: 100,
        render: (_, record) => `${record.hours} h`,
        title: '加班時數',
        width: 100
      },
      { align: 'center', dataIndex: 'reason', ellipsis: true, key: 'reason', minWidth: 160, title: '原因' },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 100,
        render: (_, record) => (
          <Tag color={overtimeStatusTagColorRecord[record.status]}>{t(overtimeStatusRecord.status[record.status])}</Tag>
        ),
        title: '狀態',
        width: 100
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
            children: (
              <Form form={form} labelCol={{ md: 6, span: 24 }}>
                <Row gutter={[16, 16]} wrap>
                  <Col lg={8} md={12} span={24}>
                    <Form.Item className="m-0" label="申請人" name="name">
                      <Input allowClear placeholder="搜尋申請人、部門、原因" />
                    </Form.Item>
                  </Col>
                  <Col lg={8} md={12} span={24}>
                    <Form.Item className="m-0" label="部門" name="department">
                      <Select allowClear options={departmentOptions} placeholder="全部部門" />
                    </Form.Item>
                  </Col>
                  <Col lg={8} md={12} span={24}>
                    <Form.Item className="m-0" label="狀態" name="status">
                      <Select allowClear options={translateOptions(overtimeStatusOptions)} placeholder="全部狀態" />
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
          title="加班管理"
          variant="borderless"
        >
          <Table rowSelection={rowSelection} scroll={scrollConfig} size="small" {...tableProps} />
        </Card>
      </div>
    </div>
  );
}
