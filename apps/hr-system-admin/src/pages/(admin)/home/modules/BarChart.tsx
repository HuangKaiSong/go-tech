import { useLang } from '@go-tech/web-admin-i18n';
import { useEcharts } from '@/hooks/use-echarts';

const BarChart = () => {
  const { t } = useTranslation();

  const { locale } = useLang();

  const { domRef, updateOptions } = useEcharts(() => ({
    xAxis: {
      type: 'category',
      data: ['技術部', '銷售部', '市場部', '人事部', '財務部', '運營部', '客服部']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
      }
    ]
  }));

  async function mockData() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });

    updateOptions(opts => {
      return opts;
    });
  }

  function updateLocale() {
    updateOptions(opts => {
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
    <ACard className="card-wrapper" variant="borderless" title={t('page.home.DepartmentHeadcount')}>
      <div className="h-360px overflow-hidden" ref={domRef} />
    </ACard>
  );
};

export default BarChart;
