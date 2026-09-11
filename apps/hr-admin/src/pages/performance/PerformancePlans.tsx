import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, Eye, Plus, Search, Settings, Target } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getPerfPlanPage, type PerfPlan, type PerfPlanStatus } from '@/api/performance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusColors: Record<PerfPlanStatus, string> = {
  1: 'bg-primary/10 text-primary border-primary/20',
  2: 'bg-success/10 text-success border-success/20',
  0: 'bg-muted text-muted-foreground'
};

export default function PerformancePlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['perfPlanPage', search, statusFilter],
    queryFn: () =>
      getPerfPlanPage({
        current: 1,
        size: 100,
        keyword: search || undefined,
        planStatus: statusFilter === 'all' ? undefined : Number(statusFilter)
      }).then(r => r.data)
  });

  const rows: PerfPlan[] = data?.records ?? [];
  const total = data?.total ?? 0;
  const active = rows.filter(d => d.planStatus === 1).length;
  const draft = rows.filter(d => d.planStatus === 0).length;
  const completed = rows.filter(d => d.planStatus === 2).length;

  const summaryCards = [
    { label: '方案總數', value: total, icon: Target, color: 'text-primary' },
    { label: '進行中', value: active, icon: BarChart3, color: 'text-primary' },
    { label: '草稿', value: draft, icon: Settings, color: 'text-muted-foreground' },
    { label: '已完成', value: completed, icon: Calendar, color: 'text-success' }
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            {t('考核方案')}
          </h1>
          <p className="page-description">{t('管理績效考核方案與指標設定')}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/performance/plans/new')}>
            <Plus className="h-4 w-4 mr-1" />
            {t('新增方案')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(card.label)}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('搜尋方案名稱...')}
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder={t('狀態')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部狀態')}</SelectItem>
                <SelectItem value="1">{t('進行中')}</SelectItem>
                <SelectItem value="0">{t('草稿')}</SelectItem>
                <SelectItem value="2">{t('已完成')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('方案名稱')}</TableHead>
                <TableHead>{t('考核週期')}</TableHead>
                <TableHead>{t('週期類型')}</TableHead>
                <TableHead>{t('考核範圍')}</TableHead>
                <TableHead className="text-center">{t('指標數')}</TableHead>
                <TableHead className="text-center">{t('考核人數')}</TableHead>
                <TableHead>{t('權重配置')}</TableHead>
                <TableHead>{t('狀態')}</TableHead>
                <TableHead>{t('操作')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    {t('載入中...')}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    {t('暫無符合條件的方案')}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/performance/plans/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.period || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(row.cycleText)}</Badge>
                    </TableCell>
                    <TableCell>{row.scopeText}</TableCell>
                    <TableCell className="text-center">{row.indicatorCount}</TableCell>
                    <TableCell className="text-center">{row.employeeCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.weightConfig}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[row.planStatus] || ''}>
                        {t(row.planStatusText)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/performance/plans/${row.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('查看')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
