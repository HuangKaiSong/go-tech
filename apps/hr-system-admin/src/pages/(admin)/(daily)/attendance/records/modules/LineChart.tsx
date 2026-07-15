import { useLang } from '@go-tech/web-admin-i18n';
import { useEcharts } from '@/hooks/use-echarts';

const LineChart = () => {
  const { t } = useTranslation();

  const { locale } = useLang();

  const { domRef, updateOptions } = useEcharts(() => ({
    grid: {
      top: '3%',
      containLabel: true,
      left: '3%',
      right: '4%'
    },
    legend: {
      data: [t('page.home.onboarding'), t('page.home.resignation')]
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: '#8e9dff',
                offset: 0.25
              },
              {
                color: '#fff',
                offset: 1
              }
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1
          }
        },
        color: '#8e9dff',
        data: [] as number[],
        emphasis: {
          focus: 'series'
        },
        name: t('page.home.onboarding'),
        smooth: true,
        stack: 'Total',
        type: 'line'
      },
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: '#26deca',
                offset: 0.25
              },
              {
                color: '#fff',
                offset: 1
              }
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1
          }
        },
        color: '#26deca',
        data: [],
        emphasis: {
          focus: 'series'
        },
        name: t('page.home.resignation'),
        smooth: true,
        stack: 'Total',
        type: 'line'
      }
    ],
    tooltip: {
      axisPointer: {
        label: {
          backgroundColor: '#6a7985'
        },
        type: 'cross'
      },
      trigger: 'axis'
    },
    xAxis: {
      boundaryGap: false,
      data: [] as string[],
      type: 'category'
    },
    yAxis: {
      type: 'value'
    }
  }));

  async function mockData() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });

    updateOptions(opts => {
      opts.xAxis.data = ['1月', '2月', '3月', '4月', '5月', '6月'];
      opts.series[0].data = [15, 20, 18, 25, 22, 23];
      opts.series[1].data = [8, 5, 10, 7, 9, 8];

      return opts;
    });
  }

  function init() {
    mockData();
  }

  function updateLocale() {
    updateOptions((opts, factory) => {
      const originOpts = factory();
      opts.legend.data = originOpts.legend.data;
      opts.series[0].name = originOpts.series[0].name;
      opts.series[1].name = originOpts.series[1].name;

      return opts;
    });
  }
  // init

  useMount(() => {
    init();
  });

  useUpdateEffect(() => {
    updateLocale();
  }, [locale]);
  return (
    <ACard className="card-wrapper" variant="borderless" title="每日出勤率趨勢">
      <div className="h-360px overflow-hidden" ref={domRef} />
    </ACard>
  );
};

export default LineChart;
