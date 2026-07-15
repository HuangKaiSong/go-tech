import { NumberTicker, SvgIcon } from '@go-tech/web-ui-compose';

interface CardDataProps {
  change: number;
  color: {
    end: string;
    start: string;
  };
  icon: string;
  key: string;
  title: string;
  trend: 'down' | 'up';
  unit: string;
  unitPostion?: 'end' | 'start';
  value: number;
}

function getGradientColor(color: CardDataProps['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}

function useGetCardData() {
  const { t } = useTranslation();

  const cardData: CardDataProps[] = [
    {
      color: {
        end: '#b955a4',
        start: '#ec4786'
      },
      icon: 'lucide:users',
      key: 'totalEmployees',
      title: t('page.home.totalEmployees'),
      unit: '',
      value: 1284,
      change: 12,
      trend: 'up'
    },
    {
      color: {
        end: '#5144b4',
        start: '#865ec0'
      },
      icon: 'lucide:user-plus',
      key: 'newEmployee',
      title: t('page.home.newEmployee'),
      unit: '',
      value: 23,
      change: 5,
      trend: 'up'
    },
    {
      color: {
        end: '#719de3',
        start: '#56cdf3'
      },
      icon: 'lucide:user-minus',
      key: 'resignation',
      title: t('page.home.resignation'),
      unit: '',
      value: 8,
      change: 2,
      trend: 'down'
    },
    {
      color: {
        end: '#f68057',
        start: '#fcbc25'
      },
      icon: 'lucide:clock',
      key: 'attendanceRate',
      title: t('page.home.attendanceRate'),
      unit: '%',
      unitPostion: 'end',
      value: 96.5,
      change: 0.3,
      trend: 'up'
    }
  ];

  return cardData;
}

const CardItem = (data: CardDataProps) => {
  return (
    <ACol key={data.key} lg={6} md={12} span={24}>
      <div
        className="flex-1 rd-8px px-16px pb-4px pt-8px text-white"
        style={{ backgroundImage: getGradientColor(data.color) }}
      >
        <div className="flex items-center justify-between ">
          <h3 className="text-16px">{data.title}</h3>
          <div className="mt-3 flex items-center gap-1 text-sm">
            {data.trend === 'up' ? (
              <SvgIcon icon="lucide:trending-up" className="h-3 w-3 text-success" />
            ) : (
              <SvgIcon icon="lucide:trending-down" className="h-3 w-3 text-warning" />
            )}
            <span className={data.trend === 'up' ? 'text-success' : 'text-warning'}>{data.change}</span>
            <span className="text-muted-foreground">較上月</span>
          </div>
        </div>
        <div className="flex justify-between pt-12px">
          <SvgIcon className="text-32px" icon={data.icon} />
          <NumberTicker
            className="text-30px"
            prefix={data.unitPostion !== 'end' ? data.unit : ''}
            suffix={data.unitPostion === 'end' ? data.unit : ''}
            decimalPlaces={`${data.value}`.split('.')[1] ? `${data.value}`.split('.')[1].length : 0}
            value={data.value}
          />
        </div>
      </div>
    </ACol>
  );
};

const CardData = () => {
  const data = useGetCardData();

  return (
    <ACard className="card-wrapper" size="small" variant="borderless">
      <ARow gutter={[16, 16]}>{data.map(CardItem)}</ARow>
    </ACard>
  );
};

export default CardData;
