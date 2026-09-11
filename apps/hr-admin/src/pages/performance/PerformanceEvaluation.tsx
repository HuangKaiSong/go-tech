import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle, ChevronRight, Clock, Search, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMyPerfTasks, getPerfTaskPage, type PerfTask, type PerfTaskStatus } from '@/api/performance';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const taskStatusColors: Record<PerfTaskStatus, string> = {
  0: 'bg-warning/10 text-warning border-warning/20',
  1: 'bg-primary/10 text-primary border-primary/20',
  2: 'bg-accent text-accent-foreground',
  3: 'bg-primary/10 text-primary border-primary/20',
  4: 'bg-success/10 text-success border-success/20'
};

function gradeClass(grade: string | null): string {
  if (!grade) return '';
  if (grade.startsWith('A')) return 'bg-success/10 text-success border-success/20';
  if (grade.startsWith('B')) return 'bg-primary/10 text-primary border-primary/20';
  return '';
}

export default function PerformanceEvaluation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['perfTaskPage', search, statusFilter],
    queryFn: () =>
      getPerfTaskPage({
        current: 1,
        size: 200,
        keyword: search || undefined,
        taskStatus: statusFilter === 'all' ? undefined : Number(statusFilter)
      }).then(r => r.data)
  });
  const { data: myTasks = [] } = useQuery({
    queryKey: ['myPerfTasks'],
    queryFn: () => getMyPerfTasks().then(r => r.data)
  });

  const rows: PerfTask[] = taskData?.records ?? [];
  const total = taskData?.total ?? 0;
  const completed = rows.filter(r => r.taskStatus === 4).length;
  const inProgress = rows.filter(r => r.taskStatus !== 4).length;
  const myPending = myTasks.filter(t => t.submitStatus === 0).length;

  const summaryCards = [
    { label: '考核人數', value: total, icon: Users, color: 'text-primary' },
    { label: '已完成', value: completed, icon: CheckCircle, color: 'text-success' },
    { label: '進行中', value: inProgress, icon: Clock, color: 'text-warning' },
    { label: '我的待辦', value: myPending, icon: BarChart3, color: 'text-primary' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          {t('績效評估')}
        </h1>
        <p className="page-description">{t('查看考核任務進度、完成三方評分')}</p>
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

      <Tabs defaultValue="my">
        <TabsList className="mb-4">
          <TabsTrigger value="my">
            {t('我的待辦')}
            {myPending > 0 && (
              <Badge className="ml-2" variant="secondary">
                {myPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">{t('全部任務')}</TabsTrigger>
        </TabsList>

        {/* 我的待办 */}
        <TabsContent value="my">
          <Card>
            <CardContent className="p-0 divide-y">
              {myTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">{t('暫無評價任務')}</div>
              ) : (
                myTasks.map(tk => (
                  <button
                    key={tk.reviewerRecordId}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left"
                    onClick={() => navigate(`/performance/evaluation/${tk.taskId}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tk.revieweeName}</span>
                        <Badge variant="outline" className="text-xs">
                          {t(tk.reviewerTypeText)}
                        </Badge>
                        {tk.submitStatus === 1 ? (
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                            {t('已提交')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs">
                            {t('待評分')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {tk.planName}
                        {tk.departmentName ? ` · ${tk.departmentName}` : ''}
                        {tk.position ? ` · ${tk.position}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 全部任务 */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('搜尋被考核人姓名...')}
                    className="pl-9 h-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder={t('狀態')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('全部狀態')}</SelectItem>
                    <SelectItem value="0">{t('待自評')}</SelectItem>
                    <SelectItem value="1">{t('同事互評中')}</SelectItem>
                    <SelectItem value="2">{t('待主管評')}</SelectItem>
                    <SelectItem value="3">{t('待校准')}</SelectItem>
                    <SelectItem value="4">{t('已完成')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('被考核人')}</TableHead>
                    <TableHead>{t('部門')}</TableHead>
                    <TableHead>{t('職位')}</TableHead>
                    <TableHead>{t('方案')}</TableHead>
                    <TableHead className="text-center">{t('自評')}</TableHead>
                    <TableHead className="text-center">{t('互評')}</TableHead>
                    <TableHead className="text-center">{t('主管評')}</TableHead>
                    <TableHead className="text-center">{t('最終')}</TableHead>
                    <TableHead className="text-center">{t('等級')}</TableHead>
                    <TableHead>{t('狀態')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                        {t('載入中...')}
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                        {t('暫無考核任務，請先發佈方案')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(row => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/performance/evaluation/${row.id}`)}
                      >
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell>{row.departmentName || '-'}</TableCell>
                        <TableCell>{row.position || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.planName}</TableCell>
                        <TableCell className="text-center">{row.selfTotal ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          {row.peerTotal ?? '-'}
                          {row.peerProgress !== '-' && (
                            <span className="text-xs text-muted-foreground ml-1">({row.peerProgress})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{row.managerTotal ?? '-'}</TableCell>
                        <TableCell className="text-center font-semibold">{row.finalScore ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          {row.grade ? (
                            <Badge variant="secondary" className={gradeClass(row.grade)}>
                              {row.grade}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={taskStatusColors[row.taskStatus] || ''}>
                            {t(row.taskStatusText)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
