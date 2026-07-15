import { SvgIcon } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Col, Row, Statistic, Tabs } from 'antd';
import { useClockLocationListQuery, useClockRuleListQuery, useClockScheduleListQuery } from '@/service/api';
import ClockLocationsTab from './modules/clock/ClockLocationsTab';
import ClockRulesTab from './modules/clock/ClockRulesTab';
import ClockSchedulesTab from './modules/clock/ClockSchedulesTab';

export const Route = createFileRoute('/(admin)/(daily)/attendance/clock-in')({
  component: RouteComponent,
  staticData: {
    title: '打卡管理'
  }
});

function useEnabledStat<T extends { enabled: boolean }>(records: T[] | undefined) {
  const list = records ?? [];
  return { enabled: list.filter(item => item.enabled).length, total: list.length };
}

function RouteComponent() {
  const { data: locationData } = useClockLocationListQuery({ current: 1, size: 100 });
  const { data: scheduleData } = useClockScheduleListQuery({ current: 1, size: 100 });
  const { data: ruleData } = useClockRuleListQuery({ current: 1, size: 100 });

  const locationStat = useEnabledStat(locationData?.records);
  const scheduleStat = useEnabledStat(scheduleData?.records);
  const ruleStat = useEnabledStat(ruleData?.records);

  return (
    <div className="h-full min-h-500px flex flex-col gap-16px overflow-auto">
      <Row gutter={[16, 16]}>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:map-pin" />}
              suffix={`/ ${locationStat.total}`}
              title="打卡地點"
              value={locationStat.enabled}
            />
          </Card>
        </Col>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:clock" />}
              suffix={`/ ${scheduleStat.total}`}
              title="班次設定"
              value={scheduleStat.enabled}
            />
          </Card>
        </Col>
        <Col lg={8} span={24}>
          <Card className="card-wrapper" variant="borderless">
            <Statistic
              prefix={<SvgIcon icon="lucide:shield" />}
              suffix={`/ ${ruleStat.total}`}
              title="打卡規則"
              value={ruleStat.enabled}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="locations"
        items={[
          {
            children: <ClockLocationsTab />,
            key: 'locations',
            label: (
              <span>
                <SvgIcon className="mr-4px inline-block" icon="lucide:map-pin" />
                打卡地點
              </span>
            )
          },
          {
            children: <ClockSchedulesTab />,
            key: 'schedules',
            label: (
              <span>
                <SvgIcon className="mr-4px inline-block" icon="lucide:clock" />
                班次時間
              </span>
            )
          },
          {
            children: <ClockRulesTab />,
            key: 'rules',
            label: (
              <span>
                <SvgIcon className="mr-4px inline-block" icon="lucide:shield" />
                打卡規則
              </span>
            )
          }
        ]}
      />
    </div>
  );
}
