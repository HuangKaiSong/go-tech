import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getPayrollConfig, type PayrollConfig, savePayrollConfig } from '@/api/payrollSetting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPerm } from '@/lib/auth';
import { PAYROLL_PERM } from '@/lib/perms';

/** 薪資參數（核算引擎口徑，每租戶一份），以 Table 呈現 */
export default function PayrollParams() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const emptyConfig: PayrollConfig = {
    standardMonthlyHours: 174,
    defaultOtMultiplier: 1,
    otHoursCap: 40,
    anomalyThreshold: 20,
    deductionCapRatio: 50,
    note: ''
  };
  const [config, setConfig] = useState<PayrollConfig>(emptyConfig);

  const { data: configData } = useQuery({
    queryKey: ['payrollConfig'],
    queryFn: () => getPayrollConfig().then(r => r.data)
  });

  useEffect(() => {
    if (configData) setConfig({ ...emptyConfig, ...configData });
    // oxlint-disable-next-line react/exhaustive-deps
  }, [configData]);

  const saveMutation = useMutation({
    mutationFn: (payload: PayrollConfig) => savePayrollConfig(payload),
    onSuccess: () => {
      toast.success(t('已保存薪資參數'));
      queryClient.invalidateQueries({ queryKey: ['payrollConfig'] });
    },
    onError: (e: Error) => toast.error(e.message || t('保存失敗'))
  });

  const update = (k: keyof PayrollConfig, v: string) => setConfig(prev => ({ ...prev, [k]: v === '' ? 0 : Number(v) }));

  const rows: { desc: string; key: keyof PayrollConfig; name: string; step?: string; unit: string }[] = [
    { key: 'standardMonthlyHours', name: '月標準工時', unit: '小時', desc: '時薪換算 / 加班時薪基數（缺省 174）' },
    {
      key: 'defaultOtMultiplier',
      name: '加班倍率缺省',
      unit: '倍',
      step: '0.01',
      desc: '員工檔案 ADW 加班倍數優先；此為缺省（香港 OT 多為合約值）'
    },
    { key: 'otHoursCap', name: '月加班時數上限', unit: '小時', desc: '超過即在核算時告警（缺省 40h）' },
    {
      key: 'anomalyThreshold',
      name: '實發異動門檻',
      unit: '%',
      desc: '與上期實發環比超過此比例則標記異動（缺省 20%）'
    },
    {
      key: 'deductionCapRatio',
      name: '扣款佔工資上限',
      unit: '%',
      desc: '《僱傭條例》第 32 條：任一發薪期扣款不得逾此比例（缺省 50%）'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('薪資參數')}</CardTitle>
        <CardDescription>
          {t('核算引擎（薪資計算）讀取的口徑參數，每租戶一份。強積金 MPF / ORSO 費率與門檻請於各薪資方案內設定。')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">{t('參數')}</TableHead>
              <TableHead className="w-40">{t('數值')}</TableHead>
              <TableHead>{t('說明')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.key}>
                <TableCell className="font-medium">{t(r.name)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={r.step}
                      className="h-9 w-28"
                      value={config[r.key] as number}
                      onChange={e => update(r.key, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">{t(r.unit)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{t(r.desc)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-6 flex justify-end">
          {hasPerm(PAYROLL_PERM.SETTING_SAVE) && (
            <Button onClick={() => saveMutation.mutate(config)} disabled={saveMutation.isPending}>
              {t('保存參數')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
