import { createFileRoute } from '@tanstack/react-router';
import type { TableColumnsType } from 'antd';
import { Button, Card, Col, Input, Row, Select, Table, Tooltip } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SvgIcon } from '@go-tech/web-ui-compose';
import { attendanceStatusRecord } from '../modules/shared';

export const Route = createFileRoute('/(admin)/(daily)/attendance/records/monthly')({
  component: RouteComponent,
  staticData: {
    menu: {
      icon: 'lucide:calendar-days',
      hide: true
    },
    title: '月度考勤'
  }
});

type AttendanceStatus = Api.Attendance.AttendanceStatus;

interface MonthRow {
  department: string;
  key: string;
  name: string;
  [day: number]: AttendanceStatus | string;
}

const EMPLOYEES = [
  { department: '技術部', name: '張小明' },
  { department: '銷售部', name: '李文華' },
  { department: '人事部', name: '王美玲' },
  { department: '市場部', name: '陳大偉' },
  { department: '財務部', name: '林佳蓉' },
  { department: '技術部', name: '趙志強' },
  { department: '銷售部', name: '黃雅琪' },
  { department: '運營部', name: '周建國' }
];

const WEEK_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

const statusCellColorRecord: Record<AttendanceStatus, string> = {
  absent: '#ff4d4f',
  early: '#fa8c16',
  late: '#faad14',
  leave: '#1677ff',
  normal: '#52c41a',
  rest: '#d9d9d9'
};

// oxlint-disable-next-line max-params
function pickStatus(name: string, day: number, month: number, dayOfWeek: number): AttendanceStatus {
  if (dayOfWeek === 0 || dayOfWeek === 6) return 'rest';
  const seed = (name.charCodeAt(0) * 31 + day * 7 + month) % 100;
  if (seed < 65) return 'normal';
  if (seed < 80) return 'late';
  if (seed < 88) return 'early';
  if (seed < 95) return 'leave';
  return 'absent';
}

const YEAR_OPTIONS = ['2025', '2026'].map(value => ({ label: value, value }));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1).padStart(2, '0');
  return { label: String(index + 1), value };
});

function RouteComponent() {
  const { t } = useTranslation();
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('03');
  const [keyword, setKeyword] = useState('');

  const { columns, dataSource } = useMemo(() => {
    const yearNum = Number.parseInt(year, 10);
    const monthNum = Number.parseInt(month, 10);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const dayColumns: TableColumnsType<MonthRow> = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      return {
        align: 'center',
        dataIndex: day,
        key: `d${day}`,
        title: (
          <div className={isWeekend ? 'text-red-400' : ''}>
            <div>{day}</div>
            <div className="text-10px opacity-60">{WEEK_NAMES[dayOfWeek]}</div>
          </div>
        ),
        render: (value: AttendanceStatus) => (
          <Tooltip title={t(attendanceStatusRecord.status[value])}>
            <span
              className="mx-auto block h-16px w-16px rounded-2px"
              style={{ backgroundColor: statusCellColorRecord[value] }}
            />
          </Tooltip>
        ),
        width: 44
      } satisfies TableColumnsType<MonthRow>[number];
    });

    const rows: MonthRow[] = EMPLOYEES.filter(
      emp => !keyword || emp.name.includes(keyword) || emp.department.includes(keyword)
    ).map(emp => {
      const row: MonthRow = { department: emp.department, key: emp.name, name: emp.name };
      for (let day = 1; day <= daysInMonth; day += 1) {
        const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
        row[day] = pickStatus(emp.name, day, monthNum, dayOfWeek);
      }
      return row;
    });

    const baseColumns: TableColumnsType<MonthRow> = [
      { align: 'center', dataIndex: 'name', fixed: 'left', key: 'name', title: '員工', width: 90 },
      { align: 'center', dataIndex: 'department', fixed: 'left', key: 'department', title: '部門', width: 90 }
    ];

    return { columns: [...baseColumns, ...dayColumns], dataSource: rows };
  }, [year, month, keyword, t]);

  const legend = (Object.keys(attendanceStatusRecord.status) as AttendanceStatus[]).map(status => (
    <div className="flex items-center gap-4px" key={status}>
      <span className="h-12px w-12px rounded-2px" style={{ backgroundColor: statusCellColorRecord[status] }} />
      <span className="text-12px text-gray-500">{t(attendanceStatusRecord.status[status])}</span>
    </div>
  ));

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-auto">
      <Card className="card-wrapper" variant="borderless">
        <Row align="middle" gutter={[16, 16]}>
          <Col>
            <Select onChange={setYear} options={YEAR_OPTIONS} style={{ width: 100 }} value={year} />
          </Col>
          <Col>
            <Select onChange={setMonth} options={MONTH_OPTIONS} style={{ width: 90 }} value={month} />
          </Col>
          <Col flex="auto">
            <Input
              allowClear
              className="max-w-260px"
              placeholder="搜尋員工、部門"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
          </Col>
          <Col>
            <div className="flex flex-wrap gap-12px">{legend}</div>
          </Col>
        </Row>
      </Card>

      <Card
        className="card-wrapper"
        title="月度考勤"
        variant="borderless"
        extra={<Button icon={<SvgIcon icon="lucide:download" />}>导出</Button>}
      >
        <Table
          bordered
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content', y: 480 }}
          size="small"
        />
      </Card>
    </div>
  );
}
