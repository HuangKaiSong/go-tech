import { useLang } from '@go-tech/web-admin-i18n';
import { useEcharts } from '@/hooks/use-echarts';

const PieChart = () => {
  const { locale } = useLang();

  const { domRef, updateOptions } = useEcharts(() => ({
    legend: {
      bottom: '1%',
      itemStyle: {
        borderWidth: 0
      },
      left: 'center'
    },
    series: [
      {
        avoidLabelOverlap: false,
        color: ['#52c41a', '#faad14', '#1677ff', '#fa8c16', '#ff4d4f', '#d9d9d9'],
        data: [] as { name: string; value: number }[],
        emphasis: {
          label: {
            fontSize: '12',
            show: true
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderRadius: 10,
          borderWidth: 1
        },
        label: {
          position: 'center',
          show: false
        },
        labelLine: {
          show: false
        },
        radius: ['45%', '75%'],
        type: 'pie'
      }
    ],
    tooltip: {
      trigger: 'item'
    }
  }));

  async function mockData() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });

    updateOptions(opts => {
      opts.series[0].data = [
        { name: '正常', value: 720 },
        { name: '遲到', value: 564 },
        { name: '請假', value: 564 },
        { name: '曠工', value: 564 },
        { name: '早退', value: 564 },
        { name: '休息', value: 564 }
      ];

      return opts;
    });
  }

  function updateLocale() {
    updateOptions(opts => {
      opts.series[0].data = [
        { name: '正常', value: 720 },
        { name: '遲到', value: 564 },
        { name: '請假', value: 564 },
        { name: '曠工', value: 564 },
        { name: '早退', value: 564 },
        { name: '休息', value: 564 }
      ];

      return opts;
    });
  }

  async function init() {
    mockData();
  }

  useMount(() => {
    init();
  });

  useUpdateEffect(() => {
    updateLocale();
  }, [locale]);
  return (
    <ACard className="card-wrapper" variant="borderless" title="出勤狀態分布">
      <div className="h-340px overflow-hidden" ref={domRef} />
    </ACard>
  );
};

export default PieChart;
