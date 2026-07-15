import { useAdminState } from '@go-tech/web-admin-layouts';
import {
  type CustomTableProps,
  SvgIcon,
  type TableColumn,
  type TableDataWithIndex,
  useTable,
  useTableScroll
} from '@go-tech/web-ui-compose';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { RefObject } from 'react';
import { useAttendanceRecordListQuery } from '@/service/api';
import { attendanceStatusRecord, attendanceStatusTagColorRecord } from '../modules/shared';

const PieChart = lazy(() => import('./modules/PieChart'));
const BarChart = lazy(() => import('./modules/BarChart'));
const LineChart = lazy(() => import('./modules/LineChart'));

export const Route = createFileRoute('/(admin)/(daily)/attendance/records/')({
  component: RouteComponent,
  staticData: {
    title: '打卡记录'
  }
});

type AttendanceRecord = TableDataWithIndex<Api.Attendance.AttendanceRecord>;

const ATTENDANCE_TABLE_SCROLL_X = 900;

const YEAR_OPTIONS = ['2024', '2025', '2026'].map(value => ({ label: value, value }));
const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1).padStart(2, '0');
  return { label: `${index + 1}`, value };
});

const RenderList = (
  props: {
    scrollConfig: { x: number; y: number | undefined };
    tableWrapperRef: RefObject<HTMLDivElement | null>;
  } & CustomTableProps<Api.Attendance.AttendanceRecord>
) => {
  return (
    <div className="min-h-0 flex flex-1 flex-col" ref={props.tableWrapperRef}>
      <ACard className="min-h-0 flex flex-1 flex-col card-wrapper" title="打卡記錄" variant="borderless">
        <ATable scroll={props.scrollConfig} size="small" {...props} />
      </ACard>
    </div>
  );
};

const RenderChar = () => {
  return (
    <ARow gutter={[16, 16]} wrap className="overflow-scroll">
      <ACol span={12}>
        <PieChart />
      </ACol>
      <ACol span={12}>
        <BarChart />
      </ACol>
      <ACol span={24}>
        <LineChart />
      </ACol>
    </ARow>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useAdminState();
  const { scrollConfig, tableWrapperRef } = useTableScroll(ATTENDANCE_TABLE_SCROLL_X);
  const [segment, setSegment] = useState<'chart' | 'list'>('list');

  const { data, form, run, tableProps, total } = useTable<
    Api.Attendance.AttendanceRecordSearchParams,
    Api.Attendance.AttendanceRecordList,
    Api.Attendance.AttendanceRecord
  >({
    apiParams: {
      current: 1,
      department: null,
      month: null,
      name: null,
      size: 10,
      status: null
    },
    columns: createColumns,
    isMobile,
    queryHook: useAttendanceRecordListQuery
  });

  form.setFieldValue('year', '2026');
  form.setFieldValue('month', '7');

  function createColumns(): TableColumn<AttendanceRecord>[] {
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
        dataIndex: 'name',
        key: 'name',
        minWidth: 120,
        title: '員工姓名'
      },
      {
        align: 'center',
        dataIndex: 'department',
        key: 'department',
        minWidth: 120,
        title: '部門'
      },
      {
        align: 'center',
        dataIndex: 'date',
        key: 'date',
        minWidth: 120,
        title: '日期',
        width: 130
      },
      {
        align: 'center',
        dataIndex: 'clockIn',
        key: 'clockIn',
        minWidth: 100,
        title: '上班打卡',
        width: 110
      },
      {
        align: 'center',
        dataIndex: 'clockOut',
        key: 'clockOut',
        minWidth: 100,
        title: '下班打卡',
        width: 110
      },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        minWidth: 90,
        render: (_, record) => (
          <ATag color={attendanceStatusTagColorRecord[record.status]}>
            {t(attendanceStatusRecord.status[record.status])}
          </ATag>
        ),
        title: '狀態',
        width: 100
      }
    ];
  }

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
      <div className="flex justify-end gap-2 items-center">
        <ASegmented
          size="large"
          options={[
            {
              label: (
                <div className="flex items-center justify-center">
                  <SvgIcon className="" icon="lucide:table-2" />
                  <div>列表</div>
                </div>
              ),
              value: 'list'
            },
            {
              label: (
                <div className="flex items-center justify-center">
                  <SvgIcon className="" icon="lucide:chart-column" />
                  <div>报表</div>
                </div>
              ),
              value: 'chart'
            }
          ]}
          value={segment}
          onChange={setSegment}
        />
        <AButton type="primary" icon={<SvgIcon icon="lucide:plus" />}>
          补卡申请
        </AButton>
      </div>

      <ARow gutter={[16, 16]}>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" classNames={{ body: 'flex justify-between items-end' }} variant="borderless">
            <AStatistic title="總記錄" value={total} />
            <p
              className="text-xs text-muted-foreground mt-1 cursor-pointer"
              onClick={() => navigate({ to: '/attendance/records/monthly' })}
            >
              點擊查看詳情 →
            </p>
          </ACard>
        </ACol>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" variant="borderless">
            <AStatistic
              title="正常出勤"
              value={data.filter(item => item.status === 'normal').length}
              classNames={{ content: 'text-success' }}
            />
          </ACard>
        </ACol>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" variant="borderless">
            <AStatistic
              title={t('page.attendance.record.status.late')}
              value={data.filter(item => item.status === 'late').length}
              classNames={{ content: 'text-warning' }}
            />
          </ACard>
        </ACol>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" variant="borderless">
            <AStatistic
              title={t('page.attendance.record.status.early')}
              value={data.filter(item => item.status === 'early').length}
              classNames={{ content: 'text-orange-500' }}
            />
          </ACard>
        </ACol>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" variant="borderless">
            <AStatistic
              title={t('page.attendance.record.status.leave')}
              value={data.filter(item => item.status === 'leave').length}
              classNames={{ content: 'text-primary' }}
            />
          </ACard>
        </ACol>
        <ACol lg={4} span={12}>
          <ACard className="card-wrapper" variant="borderless">
            <AStatistic
              title={t('page.attendance.record.status.rest')}
              value={data.filter(item => item.status === 'rest').length}
            />
          </ACard>
        </ACol>
      </ARow>

      <ACard className="card-wrapper">
        <AForm form={form} labelCol={{ md: 6, span: 24 }}>
          <ARow gutter={[16, 16]} justify="space-between">
            <ACol span={18}>
              <ARow gutter={[12, 12]}>
                <ACol span={3}>
                  <AForm.Item className="m-0" name="year">
                    <ASelect allowClear options={YEAR_OPTIONS} />
                  </AForm.Item>
                </ACol>
                <ACol span={3}>
                  <AForm.Item className="m-0" name="month">
                    <ASelect allowClear options={monthOptions} />
                  </AForm.Item>
                </ACol>
                <ACol span={6}>
                  <AForm.Item className="m-0" name="keyword">
                    <AInput allowClear placeholder="搜寻姓名或部门" />
                  </AForm.Item>
                </ACol>
              </ARow>
            </ACol>
            <ACol span={6}>
              <ASpace className="w-full justify-end">
                <AButton type="primary" onClick={() => run()}>
                  {t('common.search')}
                </AButton>
                <AButton ghost type="primary" icon={<SvgIcon icon="lucide:download" />}>
                  导出
                </AButton>
              </ASpace>
            </ACol>
          </ARow>
        </AForm>
      </ACard>

      {segment === 'list' ? (
        <RenderList tableWrapperRef={tableWrapperRef} scrollConfig={scrollConfig} {...tableProps} />
      ) : (
        <RenderChar />
      )}
    </div>
  );
}
